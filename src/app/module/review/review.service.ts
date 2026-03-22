import status from "http-status";
import AppError from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { prisma } from "../../lib/prisma";
import { ICreateReviewPayload } from "./review.interface";

const createReview = async (user: IRequestUser, payload: ICreateReviewPayload) => {
  const student = await prisma.student.findUnique({
    where: { userId: user.userId },
  });

  if (!student) {
    throw new AppError(status.NOT_FOUND, "Student profile not found");
  }

  const mentor = await prisma.mentor.findUnique({
    where: { id: payload.mentorId },
  });

  if (!mentor) {
    throw new AppError(status.NOT_FOUND, "Mentor not found");
  }

  if (payload.rating < 1 || payload.rating > 5) {
    throw new AppError(status.BAD_REQUEST, "Rating must be between 1 and 5");
  }

  // Check if student has a COMPLETED booking with this mentor
  const completedBooking = await prisma.booking.findFirst({
    where: {
      studentId: student.id,
      mentorId: mentor.id,
      status: "COMPLETED",
    },
  });

  if (!completedBooking) {
    throw new AppError(
      status.FORBIDDEN,
      "You can only review a mentor after completing a booking session with them"
    );
  }

  // Prevent multiple reviews from same student for same mentor, or allow it. Most platforms limit 1 review per mentor per student.
  const existingReview = await prisma.review.findFirst({
    where: {
      studentId: student.id,
      mentorId: mentor.id,
    },
  });

  if (existingReview) {
    throw new AppError(status.BAD_REQUEST, "You have already reviewed this mentor");
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the review
    const review = await tx.review.create({
      data: {
        studentId: student.id,
        mentorId: mentor.id,
        rating: payload.rating,
        comment: payload.comment,
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

const getMentorReviews = async (mentorId: string) => {
  const reviews = await prisma.review.findMany({
    where: { mentorId },
    include: {
      student: {
        select: {
          name: true,
          profilePhoto: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return reviews;
};

export const ReviewService = {
  createReview,
  getMentorReviews,
};
