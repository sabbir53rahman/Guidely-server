import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { ReviewService } from "./review.service";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await ReviewService.createReview(user, req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Review successfully submitted",
    data: result,
  });
});

const getMentorReviews = catchAsync(async (req: Request, res: Response) => {
  const { mentorId } = req.params as { mentorId: string };
  const result = await ReviewService.getMentorReviews(mentorId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Mentor reviews fetched successfully",
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getMentorReviews,
};
