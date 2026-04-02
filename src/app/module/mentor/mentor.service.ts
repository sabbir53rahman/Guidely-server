import status from "http-status";
import AppError from "../../errorHelpers/appError";

import { prisma } from "../../lib/prisma";
import { IUpdateMentorPayload } from "./mentor.interface";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { userSafeSelect } from "../user/user.constants";
import { UserStatus } from "../../../generated/prisma/enums";
import { Mentor } from "../../../generated/prisma/client";

const getAllMentors = async (queryParams: IQueryParams) => {
  const { searchTerm } = queryParams;

  // Create query builder with only direct searchable fields
  const queryBuilder = new QueryBuilder<Mentor>(prisma.mentor, queryParams, {
    searchableFields: ["expertise", "bio"], // Only fields that don't have user equivalents
  })
    .filter()
    .paginate()
    .sort()
    .where({ isDeleted: false })
    .include({ user: { select: userSafeSelect } });

  // Get the built query and modify where condition for mentor name and email search
  const query = queryBuilder.getQuery();

  // Handle search for mentor name and email (from both mentor and user tables)
  if (searchTerm) {
    query.where = {
      ...query.where,
      OR: [
        // Search in mentor direct fields
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { expertise: { contains: searchTerm, mode: "insensitive" } },
        { bio: { contains: searchTerm, mode: "insensitive" } },
        // Search in user table fields
        { user: { name: { contains: searchTerm, mode: "insensitive" } } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ],
    };
  }

  // Execute the query with modified where condition
  const [total, data] = await Promise.all([
    prisma.mentor.count({ where: query.where } as Parameters<
      typeof prisma.mentor.count
    >[0]),
    prisma.mentor.findMany(
      query as Parameters<typeof prisma.mentor.findMany>[0],
    ),
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

  return {
    data,
    meta,
  };
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
      reviews: {
        include: {
          student: true,
        },
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
      reviews: {
        include: {
          student: true,
        },
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
    const deletedEmail = `deleted_${Date.now()}_${isMentorExist.email}`;

    await tx.mentor.update({
      where: { id },
      data: {
        email: deletedEmail,
        isDeleted: true,
      },
    });

    await tx.user.update({
      where: { id: isMentorExist.userId },
      data: {
        email: deletedEmail,
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
