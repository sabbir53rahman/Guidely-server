/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "../../lib/prisma";
import { stripe } from "../../lib/stripe";
import "dotenv/config";
import AppError from "../../errorHelpers/appError";
import status from "http-status";

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

  // Create initial payment record
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = event.data.object as any;
    const bookingId = session.client_reference_id;
    const stripeEventId = event.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          paymentGatewayData: paymentGatewayData,
        },
      });
    });
  }

  return { received: true };
};

export const PaymentService = {
  createCheckoutSession,
  handleWebhook,
};
