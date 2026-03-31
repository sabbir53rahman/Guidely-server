import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { ReviewService } from "./review.service";
import pick from "../../utils/pick";
import { reviewFilterableFields } from "./review.constants";
import { IQueryParams } from "../../interfaces/query.interface";

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
  const filters = pick(req.query, reviewFilterableFields) as IQueryParams;
  const result = await ReviewService.getMentorReviews(mentorId, filters);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Mentor reviews fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const filters = pick(req.query, reviewFilterableFields) as IQueryParams;
  const result = await ReviewService.getMyReviews(user, filters);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Your reviews fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const ReviewController = {
  createReview,
  getMentorReviews,
  getMyReviews,
};
