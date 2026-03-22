import status from "http-status";
import { UserStatus } from "../../../generated/prisma";
import AppError from "../../errorHelpers/appError";

import { prisma } from "../../lib/prisma";
import { IUpdateMentorPayload } from "./mentor.interface";

const getAllMentors = async () => {
  const mentors = await prisma.mentor.findMany({
    where: {
      isDeleted: false,
    },
    include: {
      user: true,
    },
  });
  return mentors;
};

const getMentorById = async (id: string) => {
  const mentor = await prisma.mentor.findUnique({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      user: true,
    },
  });

  if (!mentor) {
    throw new AppError(status.NOT_FOUND, "Mentor not found");
  }

  return mentor;
};

const updateMentor = async (id: string, payload: IUpdateMentorPayload) => {
  const isMentorExist = await prisma.mentor.findUnique({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!isMentorExist) {
    throw new AppError(status.NOT_FOUND, "Mentor not found");
  }

  const updatedMentor = await prisma.mentor.update({
    where: {
      id,
    },
    data: {
      ...payload,
    },
  });

  return updatedMentor;
};

const deleteMentor = async (id: string) => {
  const isMentorExist = await prisma.mentor.findUnique({
    where: {
      id,
      isDeleted: false,
    },
  });

  if (!isMentorExist) {
    throw new AppError(status.NOT_FOUND, "Mentor not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.mentor.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });

    await tx.user.update({
      where: { id: isMentorExist.userId },
      data: {
        isDeleted: true,
        status: UserStatus.DELETED,
      },
    });

    return { id, isDeleted: true };
  });

  return result;
};

export const MentorService = {
  getAllMentors,
  getMentorById,
  updateMentor,
  deleteMentor,
};
