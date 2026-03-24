import status from "http-status";
import { UserStatus } from "../../../generated/prisma";
import AppError from "../../errorHelpers/appError";

import { prisma } from "../../lib/prisma";
import { IUpdateMentorPayload } from "./mentor.interface";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { mentorSearchableFields } from "./mentor.constants";
import { Mentor } from "../../../generated/prisma";
import { userSafeSelect } from "../user/user.constants";

const getAllMentors = async (queryParams: IQueryParams) => {
  const queryBuilder = new QueryBuilder<Mentor>(prisma.mentor, queryParams, {
    searchableFields: mentorSearchableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .where({ isDeleted: false })
    .include({ user: { select: userSafeSelect } });

  const result = await queryBuilder.execute();
  return result;
};

const getMentorById = async (id: string) => {
  const mentor = await prisma.mentor.findUnique({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      user: {
        select: userSafeSelect,
      },
    },
  });

  if (!mentor) {
    throw new AppError(status.NOT_FOUND, "Mentor not found");
  }

  return mentor;
};

const getMyMentorProfile = async (userId: string) => {
  const mentor = await prisma.mentor.findUnique({
    where: {
      userId,
      isDeleted: false,
    },
    include: {
      user: {
        select: userSafeSelect,
      },
    },
  });

  if (!mentor) {
    throw new AppError(status.NOT_FOUND, "Mentor profile not found");
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
  getMyMentorProfile,
  updateMentor,
  deleteMentor,
};
