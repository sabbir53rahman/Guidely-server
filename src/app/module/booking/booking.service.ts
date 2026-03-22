import status from "http-status";
import { DayOfWeek } from "../../../generated/prisma";
import AppError from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreateBookingPayload, IUpdateBookingPayload } from "./booking.interface";

const createBooking = async (user: IRequestUser, payload: ICreateBookingPayload) => {
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

  const startDateTime = new Date(payload.startTime);
  const endDateTime = new Date(payload.endTime);

  if (startDateTime >= endDateTime) {
    throw new AppError(status.BAD_REQUEST, "End time must be after start time");
  }

  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const dayOfWeek = days[startDateTime.getDay()] as DayOfWeek;

  // 1. Check if Mentor operates on this day
  const schedule = await prisma.schedule.findUnique({
    where: {
      mentorId_dayOfWeek: {
        mentorId: mentor.id,
        dayOfWeek: dayOfWeek,
      },
    },
  });

  if (!schedule) {
    throw new AppError(status.BAD_REQUEST, `Mentor is not available on ${dayOfWeek}`);
  }

  // 2. Validate requested time falls within the mentor's scheduled working hours for that day
  const requestedStartMinutes = startDateTime.getHours() * 60 + startDateTime.getMinutes();
  const requestedEndMinutes = endDateTime.getHours() * 60 + endDateTime.getMinutes();

  const [scheduleStartHour, scheduleStartMin] = schedule.startTime.split(":").map(Number);
  const [scheduleEndHour, scheduleEndMin] = schedule.endTime.split(":").map(Number);

  const scheduleStartMinutes = scheduleStartHour * 60 + scheduleStartMin;
  const scheduleEndMinutes = scheduleEndHour * 60 + scheduleEndMin;

  if (requestedStartMinutes < scheduleStartMinutes || requestedEndMinutes > scheduleEndMinutes) {
    throw new AppError(
      status.BAD_REQUEST,
      `Requested time is outside mentor's scheduled hours for this day (${schedule.startTime} - ${schedule.endTime})`
    );
  }

  // 3. Detect Conflicts (Overlapping Bookings)
  const existingBooking = await prisma.booking.findFirst({
    where: {
      mentorId: mentor.id,
      status: {
        in: ["SCHEDULED", "INPROGRESS"],
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
    throw new AppError(status.CONFLICT, "Mentor already has a conflicting booking at the requested time");
  }

  const booking = await prisma.booking.create({
    data: {
      studentId: student.id,
      mentorId: mentor.id,
      startTime: startDateTime,
      endTime: endDateTime,
      notes: payload.notes,
      status: "SCHEDULED",
      paymentStatus: "UNPAID",
    },
  });

  return booking;
};

const getAllBookings = async () => {
  const bookings = await prisma.booking.findMany({
    include: {
      student: true,
      mentor: true,
      payment: true,
    },
  });
  return bookings;
};

const getMyBookings = async (user: IRequestUser) => {
  const query: { studentId?: string; mentorId?: string } = {};

  if (user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: user.userId },
    });
    if (!student) throw new AppError(status.NOT_FOUND, "Student profile not found");
    query.studentId = student.id;
  } else if (user.role === "MENTOR") {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: user.userId },
    });
    if (!mentor) throw new AppError(status.NOT_FOUND, "Mentor profile not found");
    query.mentorId = mentor.id;
  } else {
    // If admin, they probably shouldn't use "getMyBookings", but just in case
    return [];
  }

  const bookings = await prisma.booking.findMany({
    where: query,
    include: {
      student: true,
      mentor: true,
      payment: true,
    },
  });

  return bookings;
};

const getBookingById = async (id: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      student: true,
      mentor: true,
      payment: true,
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

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: {
      status: payload.status,
      paymentStatus: payload.paymentStatus,
      startTime: payload.startTime ? new Date(payload.startTime) : undefined,
      endTime: payload.endTime ? new Date(payload.endTime) : undefined,
      notes: payload.notes,
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

  const deletedBooking = await prisma.booking.delete({
    where: { id },
  });

  return deletedBooking;
};

export const BookingService = {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
