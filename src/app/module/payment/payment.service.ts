/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import "dotenv/config";
import AppError from "../../errorHelpers/appError";
import status from "http-status";
import { sendEmail } from "../../utils/email";
import { envVars } from "../../../config/env";

const createCheckoutSession = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      mentor: true,
      student: true,
    },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found");
  }

  const mentor = booking.mentor;
  if (!mentor.hourlyRate || mentor.hourlyRate <= 0) {
    throw new AppError(
      status.BAD_REQUEST,
      "Mentor does not have a valid hourly rate set",
    );
  }

  // Calculate duration in hours
  const durationInMs = booking.endTime.getTime() - booking.startTime.getTime();
  const durationInHours = durationInMs / (1000 * 60 * 60);

  // Total amount in cents
  const totalAmountInCents = Math.round(
    durationInHours * mentor.hourlyRate * 100,
  );

  if (totalAmountInCents < 50) {
    // Stripe minimum is usually 50 cents
    throw new AppError(status.BAD_REQUEST, "Minimum booking amount is $0.50");
  }

  if (booking.paymentStatus === "PAID") {
    throw new AppError(status.BAD_REQUEST, "This booking has already been paid.");
  }

  // Generate a unique transaction ID
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Mentorship Session with ${mentor.name}`,
            description: `Booking from ${booking.startTime.toLocaleString()} to ${booking.endTime.toLocaleString()}`,
          },
          unit_amount: totalAmountInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    customer_email: booking.student.email,
    client_reference_id: booking.id,
    metadata: {
      bookingId: booking.id,
      transactionId: transactionId,
    },
  });

  // Create or Update initial payment record using upsert
  await prisma.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      amount: totalAmountInCents / 100,
      transactionId: transactionId,
      status: "UNPAID",
    },
    update: {
      amount: totalAmountInCents / 100,
      transactionId: transactionId,
      status: "UNPAID",
    },
  });

  return session.url;
};

const handleWebhook = async (payload: string, signature: string) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    throw new AppError(status.BAD_REQUEST, `Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const bookingId = session.client_reference_id;
    const stripeEventId = event.id;
    const paymentIntentId = session.payment_intent;
    const paymentGatewayData = JSON.parse(JSON.stringify(session));

    await prisma.$transaction(async (tx) => {
      // 1. Update Booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: "PAID",
          status: "SCHEDULED", // In case it was PENDING or something
        },
      });

      // 2. Update Payment record
      await tx.payment.update({
        where: { bookingId: bookingId },
        data: {
          status: "PAID",
          stripeEventId: stripeEventId,
          paymentIntentId: paymentIntentId,
          paymentGatewayData: paymentGatewayData,
        },
      });
    });

    // 3. Send Confirmation Email
    const bookingDetails = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: true,
        mentor: true,
      },
    });

    if (bookingDetails) {
      const duration =
        (bookingDetails.endTime.getTime() -
          bookingDetails.startTime.getTime()) /
        (1000 * 60 * 60);

      await sendEmail({
        to: bookingDetails.student.email,
        subject: "Guidely - Booking Confirmation",
        templateName: "booking_confirmation",
        templateData: {
          studentName: bookingDetails.student.name,
          mentorName: bookingDetails.mentor.name,
          startTime: bookingDetails.startTime.toLocaleString(),
          duration: `${duration} hours`,
          meetingLink: bookingDetails.meetingLink,
          dashboardUrl: `${envVars.FRONTEND_URL}/dashboard/student`,
        },
      });
    }
  }

  return { received: true };
};

const refundPayment = async (bookingId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
  });

  if (!payment || payment.status !== "PAID" || !payment.paymentIntentId) {
    return null; // Nothing to refund or not paid
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: payment.paymentIntentId,
    });

    await prisma.payment.update({
      where: { bookingId },
      data: {
        status: "UNPAID", // Or add Refunced status
        paymentGatewayData: JSON.parse(JSON.stringify(refund)),
      },
    });

    return refund;
  } catch (error: any) {
    console.error("Stripe Refund Error:", error.message);
    throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to process refund");
  }
};

const verifyPayment = async (sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status === "paid") {
    const bookingId = session.client_reference_id;
    const paymentIntentId = session.payment_intent;
    const stripeEventId = session.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId as string },
    });

    if (booking && booking.paymentStatus !== "PAID") {
      await prisma.$transaction(async (tx) => {
        // 1. Update Booking
        await tx.booking.update({
          where: { id: bookingId as string },
          data: {
            paymentStatus: "PAID",
            status: "SCHEDULED",
          },
        });

        // 2. Update Payment
        await tx.payment.update({
          where: { bookingId: bookingId as string },
          data: {
            status: "PAID",
            paymentIntentId: paymentIntentId as string,
            stripeEventId: stripeEventId,
            paymentGatewayData: JSON.parse(JSON.stringify(session)),
          },
        });
      });

      // 3. Send Confirmation Email
      const bookingDetails = await prisma.booking.findUnique({
        where: { id: bookingId as string },
        include: {
          student: true,
          mentor: true,
        },
      });

      if (bookingDetails) {
        const duration =
          (bookingDetails.endTime.getTime() -
            bookingDetails.startTime.getTime()) /
          (1000 * 60 * 60);

        await sendEmail({
          to: bookingDetails.student.email,
          subject: "Guidely - Booking Confirmation",
          templateName: "booking_confirmation",
          templateData: {
            studentName: bookingDetails.student.name,
            mentorName: bookingDetails.mentor.name,
            startTime: bookingDetails.startTime.toLocaleString(),
            duration: `${duration} hours`,
            meetingLink: bookingDetails.meetingLink,
            dashboardUrl: `${envVars.FRONTEND_URL}/dashboard/student`,
          },
        });
      }
    }
    return { success: true };
  }
  return { success: false };
};

export const PaymentService = {
  createCheckoutSession,
  handleWebhook,
  refundPayment,
  verifyPayment,
};
