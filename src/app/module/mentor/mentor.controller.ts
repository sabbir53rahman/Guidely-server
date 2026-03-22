import { Request, Response } from "express";

import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { MentorService } from "./mentor.service";

const getAllMentors = catchAsync(async (req: Request, res: Response) => {
  const result = await MentorService.getAllMentors();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Mentors retrieved successfully",
    data: result,
  });
});

const getMentorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await MentorService.getMentorById(id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Mentor retrieved successfully",
    data: result,
  });
});

const updateMentor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await MentorService.updateMentor(id, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Mentor updated successfully",
    data: result,
  });
});

const deleteMentor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await MentorService.deleteMentor(id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Mentor deleted successfully",
    data: result,
  });
});

export const MentorController = {
  getAllMentors,
  getMentorById,
  updateMentor,
  deleteMentor,
};
