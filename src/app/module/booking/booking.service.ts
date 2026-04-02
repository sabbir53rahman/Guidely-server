import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import {
  ICreateBookingPayload,
  IUpdateBookingPayload,
} from "./booking.interface";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { bookingSearchableFields } from "./booking.constants";
import { PaymentService } from "../payment/payment.service";
import crypto from "crypto";
import { DayOfWeek } from "../../../generated/prisma/enums";
import { Booking } from "../../../generated/prisma/client";

const createBooking = async (
  user: IRequestUser,
  payload: ICreateBookingPayload,
) => {
  const student = await prisma.student.findUnique({
    where: {
      userId: user.userId,
    },
  });

  if (!student) {
    throw new AppError(status.NOT_FOUND, "Student not found with this user");
  }

  const mentor = await prisma.mentor.findUnique({
    where: {
      id: payload.mentorId,
      isDeleted: false,
    },
  });

  if (!mentor) {
    throw new AppError(status.NOT_FOUND, "Mentor not found");
  }

  if (!mentor.isAvailable) {
    throw new AppError(
      status.FORBIDDEN,
      "This mentor is not currently accepting bookings.",
    );
  }

  const startDateTime = new Date(payload.startTime);
  const endDateTime = new Date(payload.endTime);

  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

  if (startDateTime < thirtyMinutesFromNow) {
    throw new AppError(
      status.BAD_REQUEST,
      "Booking must be made at least 30 minutes before the session starts.",
    );
  }

  if (startDateTime >= endDateTime) {
    throw new AppError(status.BAD_REQUEST, "End time must be after start time");
  }

  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const dayOfWeek = days[startDateTime.getUTCDay()] as DayOfWeek;

  // 1. Check if Mentor has a scheduled slot that covers this time range on this day
  // Use UTC time consistently for comparison
  const requestStartStr =
    startDateTime.getUTCHours().toString().padStart(2, "0") +
    ":" +
    startDateTime.getUTCMinutes().toString().padStart(2, "0");
  const requestEndStr =
    endDateTime.getUTCHours().toString().padStart(2, "0") +
    ":" +
    endDateTime.getUTCMinutes().toString().padStart(2, "0");

  const schedule = await prisma.schedule.findFirst({
    where: {
      mentorId: mentor.id,
      dayOfWeek: dayOfWeek,
      startTime: { lte: requestStartStr },
      endTime: { gte: requestEndStr },
    },
  });

  if (!schedule) {
    throw new AppError(
      status.BAD_REQUEST,
      `Mentor is not available at the requested time on ${dayOfWeek} (${requestStartStr} - ${requestEndStr}).`,
    );
  }

  // 3. Detect Conflicts (Overlapping Bookings)
  // First, cleanup 'expired' PENDING bookings that haven't been paid for 15+ minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  await prisma.booking.deleteMany({
    where: {
      mentorId: mentor.id,
      status: "PENDING",
      createdAt: {
        lt: fifteenMinutesAgo,
      },
      AND: [
        { startTime: { lt: endDateTime } },
        { endTime: { gt: startDateTime } },
      ],
    },
  });

  const existingBooking = await prisma.booking.findFirst({
    where: {
      mentorId: mentor.id,
      status: {
        in: ["SCHEDULED", "INPROGRESS", "PENDING"],
      },
      AND: [
        {
          startTime: {
            lt: endDateTime,
          },
        },
        {
          endTime: {
            gt: startDateTime,
          },
        },
      ],
    },
  });

  if (existingBooking) {
    throw new AppError(
      status.CONFLICT,
      "This slot is currently being booked or already scheduled by another student.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const uniqueMeetingId = crypto.randomBytes(8).toString("hex");
    const dynamicMeetingLink = `https://meet.jit.si/Guidely-${uniqueMeetingId}`;

    const booking = await tx.booking.create({
      data: {
        studentId: student.id,
        mentorId: mentor.id,
        startTime: startDateTime,
        endTime: endDateTime,
        notes: payload.notes,
        status: mentor.hourlyRate > 0 ? "PENDING" : "SCHEDULED",
        paymentStatus: "UNPAID",
        meetingLink: dynamicMeetingLink,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
          },
        },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            expertise: true,
            hourlyRate: true,
          },
        },
      },
    });

    return booking;
  });

  let paymentSessionUrl = null;
  if (mentor.hourlyRate > 0) {
    paymentSessionUrl = await PaymentService.createCheckoutSession(result.id);
  }

  return { ...result, paymentSessionUrl };
};

const getAllBookings = async (queryParams: IQueryParams) => {
  const queryBuilder = new QueryBuilder<Booking>(prisma.booking, queryParams, {
    searchableFields: bookingSearchableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .include({
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
      mentor: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          expertise: true,
          hourlyRate: true,
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          transactionId: true,
          status: true,
        },
      },
    });

  const result = await queryBuilder.execute();
  return result;
};

const getMyBookings = async (user: IRequestUser, queryParams: IQueryParams) => {
  const condition: { studentId?: string; mentorId?: string } = {};

  if (user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: user.userId },
    });
    if (!student)
      throw new AppError(status.NOT_FOUND, "Student profile not found");
    condition.studentId = student.id;
  } else if (user.role === "MENTOR") {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: user.userId },
    });
    if (!mentor)
      throw new AppError(status.NOT_FOUND, "Mentor profile not found");
    condition.mentorId = mentor.id;
  } else {
    // If admin, they probably shouldn't use "getMyBookings", but just in case
    return { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  }

  const queryBuilder = new QueryBuilder<Booking>(prisma.booking, queryParams, {
    searchableFields: bookingSearchableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .where(condition)
    .include({
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
      mentor: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          expertise: true,
          hourlyRate: true,
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          transactionId: true,
          status: true,
        },
      },
      review: true,
    });

  const result = await queryBuilder.execute();
  return result;
};

const getBookingById = async (id: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
      mentor: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          expertise: true,
          hourlyRate: true,
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          transactionId: true,
          status: true,
        },
      },
    },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found");
  }

  return booking;
};

const updateBooking = async (id: string, payload: IUpdateBookingPayload) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found");
  }

  // Prevent completing before the time is over
  if (payload.status === "COMPLETED") {
    const now = new Date();
    if (now < booking.endTime) {
      throw new AppError(
        status.BAD_REQUEST,
        "You cannot mark a booking as completed before the session time is officially over.",
      );
    }
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: {
      status: payload.status,
      paymentStatus: payload.paymentStatus,
      startTime: payload.startTime ? new Date(payload.startTime) : undefined,
      endTime: payload.endTime ? new Date(payload.endTime) : undefined,
      notes: payload.notes,
      meetingLink: payload.meetingLink,
    },
  });

  return updatedBooking;
};

const deleteBooking = async (id: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found");
  }

  await prisma.payment.deleteMany({
    where: { bookingId: id },
  });

  const deletedBooking = await prisma.booking.delete({
    where: { id },
  });

  return deletedBooking;
};

const cancelBooking = async (id: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found");
  }

  // 1. Trigger Refund if PAID
  if (booking.paymentStatus === "PAID") {
    await PaymentService.refundPayment(id);
  }

  // 2. Delete payment record first (to satisfy Prisma relation constraints)
  await prisma.payment.deleteMany({
    where: { bookingId: id },
  });

  // 3. Delete the booking completely from the database
  const result = await prisma.booking.delete({
    where: { id },
  });

  return result;
};

export const BookingService = {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  cancelBooking,
};
