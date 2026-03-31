import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreateSchedulePayload } from "./schedule.interface";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Schedule } from "../../../generated/prisma";

const createSchedule = async (user: IRequestUser, payload: ICreateSchedulePayload) => {
  const mentor = await prisma.mentor.findUnique({
    where: { userId: user.userId },
  });

  if (!mentor) {
    throw new AppError(status.NOT_FOUND, "Mentor profile not found");
  }

  // Find all schedules for this mentor on the same day
  const existingSchedules = await prisma.schedule.findMany({
    where: {
      mentorId: mentor.id,
      dayOfWeek: payload.dayOfWeek,
    },
  });

  // Check for time overlap
  const isOverlapping = existingSchedules.some((s) => {
    return (
      (payload.startTime >= s.startTime && payload.startTime < s.endTime) ||
      (payload.endTime > s.startTime && payload.endTime <= s.endTime) ||
      (s.startTime >= payload.startTime && s.startTime < payload.endTime)
    );
  });

  if (isOverlapping) {
    throw new AppError(
      status.BAD_REQUEST,
      `You already have a schedule that overlaps with ${payload.startTime} - ${payload.endTime} on ${payload.dayOfWeek}.`,
    );
  }

  const schedule = await prisma.schedule.create({
    data: {
      mentorId: mentor.id,
      dayOfWeek: payload.dayOfWeek,
      startTime: payload.startTime,
      endTime: payload.endTime,
    },
  });

  return schedule;
};

const getAllSchedules = async (queryParams: IQueryParams) => {
  const { searchTerm } = queryParams;
  
  // Create query builder without searchable fields to avoid automatic search on dayOfWeek
  const queryBuilder = new QueryBuilder<Schedule>(prisma.schedule, queryParams, {
    searchableFields: [], // No direct searchable fields
  })
    .filter() // Only apply filters, not search
    .paginate()
    .sort()
    .include({
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          bookings: {
            where: {
              status: {
                in: ["SCHEDULED", "PENDING", "INPROGRESS"],
              },
            },
          },
        },
      },
    });

  // Get the built query and modify where condition for mentor search
  const query = queryBuilder.getQuery();
  
  // Start with existing where conditions from QueryBuilder filters
  let whereCondition = { ...query.where };
  
  // Handle search for mentor name and email only
  if (searchTerm) {
    whereCondition = {
      ...whereCondition,
      mentor: {
        user: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } }
          ]
        }
      }
    };
  }

  // Update the query where condition
  query.where = whereCondition;

  // Execute the query with modified where condition
  const [total, data] = await Promise.all([
    prisma.schedule.count({ where: query.where } as Parameters<typeof prisma.schedule.count>[0]),
    prisma.schedule.findMany(query as Parameters<typeof prisma.schedule.findMany>[0])
  ]);

  // Get pagination info
  const page = queryParams.page ? parseInt(queryParams.page as string) : 1;
  const limit = queryParams.limit ? parseInt(queryParams.limit as string) : 10;
  const totalPages = Math.ceil(total / limit);

  const meta = {
    page,
    limit,
    total,
    totalPages,
  };

  // Mapping to add 'isBooked' flag
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (data as any[]).map((schedule) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isBooked = schedule.mentor.bookings.some((booking: any) => {
      // 1. Check if same Day of Week (using local time to match schedule day)
      const days = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ];
      const bookingDay = days[booking.startTime.getDay()];
      if (bookingDay !== schedule.dayOfWeek) return false;

      // 2. Check if time overlaps (using local hours/minutes to match schedule strings)
      const startH = booking.startTime.getHours().toString().padStart(2, "0");
      const startM = booking.startTime.getMinutes().toString().padStart(2, "0");
      const bookingStartStr = `${startH}:${startM}`;

      const endH = booking.endTime.getHours().toString().padStart(2, "0");
      const endM = booking.endTime.getMinutes().toString().padStart(2, "0");
      const bookingEndStr = `${endH}:${endM}`;

      return (
        (bookingStartStr >= schedule.startTime &&
          bookingStartStr < schedule.endTime) ||
        (bookingEndStr > schedule.startTime &&
          bookingEndStr <= schedule.endTime)
      );
    });

    return {
      ...schedule,
      isBooked,
    };
  });

  return {
    data: result,
    meta,
  };
};

const getMySchedules = async (user: IRequestUser) => {
  const mentor = await prisma.mentor.findUnique({
    where: { userId: user.userId },
  });

  if (!mentor) {
    throw new AppError(status.NOT_FOUND, "Mentor profile not found");
  }

  const schedules = await prisma.schedule.findMany({
    where: { mentorId: mentor.id },
  });

  return schedules;
};

const updateSchedule = async (id: string, user: IRequestUser, payload: Partial<ICreateSchedulePayload>) => {
  const mentor = await prisma.mentor.findUnique({
    where: { userId: user.userId },
  });

  if (!mentor) {
    throw new AppError(status.NOT_FOUND, "Mentor profile not found");
  }

  const scheduleInfo = await prisma.schedule.findUnique({
    where: { id },
  });

  if (!scheduleInfo) {
    throw new AppError(status.NOT_FOUND, "Schedule not found");
  }

  if (scheduleInfo.mentorId !== mentor.id) {
    throw new AppError(status.FORBIDDEN, "You cannot update another mentor's schedule");
  }

  const result = await prisma.schedule.update({
    where: { id },
    data: payload,
  });

  return result;
};

const deleteSchedule = async (id: string, user: IRequestUser) => {
  const mentor = await prisma.mentor.findUnique({
    where: { userId: user.userId },
  });

  if (!mentor) {
    throw new AppError(status.NOT_FOUND, "Mentor profile not found");
  }

  const scheduleInfo = await prisma.schedule.findUnique({
    where: { id },
  });

  if (!scheduleInfo) {
    throw new AppError(status.NOT_FOUND, "Schedule not found");
  }

  if (scheduleInfo.mentorId !== mentor.id) {
    throw new AppError(status.FORBIDDEN, "You cannot delete another mentor's schedule");
  }

  const result = await prisma.schedule.delete({
    where: { id },
  });

  return result;
};

export const ScheduleService = {
  createSchedule,
  getAllSchedules,
  getMySchedules,
  updateSchedule,
  deleteSchedule,
};
