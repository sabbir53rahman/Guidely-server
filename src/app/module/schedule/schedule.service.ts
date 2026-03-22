import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreateSchedulePayload } from "./schedule.interface";

const createSchedule = async (user: IRequestUser, payload: ICreateSchedulePayload) => {
  const mentor = await prisma.mentor.findUnique({
    where: { userId: user.userId },
  });

  if (!mentor) {
    throw new AppError(status.NOT_FOUND, "Mentor profile not found");
  }

  const existingSchedule = await prisma.schedule.findUnique({
    where: {
      mentorId_dayOfWeek: {
        mentorId: mentor.id,
        dayOfWeek: payload.dayOfWeek,
      },
    },
  });

  if (existingSchedule) {
    throw new AppError(status.BAD_REQUEST, "Schedule for this day already exists. Please update it instead.");
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
  getMySchedules,
  updateSchedule,
  deleteSchedule,
};
