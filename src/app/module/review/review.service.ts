import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreateReviewPayload } from "./review.interface";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { reviewSearchableFields } from "./review.constants";
import { Review } from "../../../generated/prisma/client";

const createReview = async (
  user: IRequestUser,
  payload: ICreateReviewPayload,
) => {
  const student = await prisma.student.findUnique({
    where: { userId: user.userId },
  });

  if (!student) {
    throw new AppError(status.NOT_FOUND, "Student profile not found");
  }

  // 1. Validate mentor exists
  const mentor = await prisma.mentor.findUnique({
    where: { id: payload.mentorId },
  });

  if (!mentor) {
    throw new AppError(status.NOT_FOUND, "Mentor not found");
  }

  // 2. Validate rating
  if (payload.rating < 1 || payload.rating > 5) {
    throw new AppError(status.BAD_REQUEST, "Rating must be between 1 and 5");
  }

  // 3. Check if booking exists, belongs to student, and is COMPLETED
  const targetBooking = await prisma.booking.findUnique({
    where: {
      id: payload.bookingId,
      studentId: student.id,
      mentorId: mentor.id,
      status: "COMPLETED",
    },
  });

  if (!targetBooking) {
    throw new AppError(
      status.FORBIDDEN,
      "You can only review a mentor after completing a verified booking session with them",
    );
  }

  // 4. Check if a review already exists for this specific booking
  const existingReview = await prisma.review.findUnique({
    where: { bookingId: payload.bookingId },
  });

  if (existingReview) {
    throw new AppError(
      status.BAD_REQUEST,
      "You have already reviewed this specific session.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Create the review linked to the booking
    const review = await tx.review.create({
      data: {
        studentId: student.id,
        mentorId: mentor.id,
        bookingId: payload.bookingId,
        rating: payload.rating,
        comment: payload.comment || "N/A",
      },
    });

    // 2. Calculate new average rating
    const allReviews = await tx.review.findMany({
      where: { mentorId: mentor.id },
      select: { rating: true },
    });

    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = totalRating / allReviews.length;

    // 3. Update Mentor rating
    await tx.mentor.update({
      where: { id: mentor.id },
      data: {
        averageRating: parseFloat(averageRating.toFixed(1)),
      },
    });

    return review;
  });

  return result;
};

const getMentorReviews = async (
  mentorId: string,
  queryParams: IQueryParams,
) => {
  const queryBuilder = new QueryBuilder<Review>(prisma.review, queryParams, {
    searchableFields: reviewSearchableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .where({ mentorId })
    .include({
      student: {
        select: {
          name: true,
          profilePhoto: true,
        },
      },
    });

  const result = await queryBuilder.execute();
  return result;
};

const getMyReviews = async (user: IRequestUser, queryParams: IQueryParams) => {
  if (user.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: user.userId },
    });

    if (!student) {
      throw new AppError(status.NOT_FOUND, "Student profile not found");
    }

    const queryBuilder = new QueryBuilder<Review>(prisma.review, queryParams, {
      searchableFields: reviewSearchableFields,
    })
      .search()
      .filter()
      .paginate()
      .sort()
      .where({ studentId: student.id })
      .include({
        mentor: {
          select: {
            name: true,
            profilePhoto: true,
            expertise: true,
          },
        },
      });

    const result = await queryBuilder.execute();
    return result;
  }

  if (user.role === "MENTOR") {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: user.userId },
    });

    if (!mentor) {
      throw new AppError(status.NOT_FOUND, "Mentor profile not found");
    }

    const queryBuilder = new QueryBuilder<Review>(prisma.review, queryParams, {
      searchableFields: reviewSearchableFields,
    })
      .search()
      .filter()
      .paginate()
      .sort()
      .where({ mentorId: mentor.id })
      .include({
        student: {
          select: {
            name: true,
            profilePhoto: true,
          },
        },
      });

    const result = await queryBuilder.execute();
    return result;
  }

  throw new AppError(status.UNAUTHORIZED, "Unauthorized action");
};

export const ReviewService = {
  createReview,
  getMentorReviews,
  getMyReviews,
};
