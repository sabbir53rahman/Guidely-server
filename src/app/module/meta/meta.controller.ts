import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { metaService } from "./meta.service";

const getOverviewStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  let result;

  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
    result = await metaService.getAdminOverviewStats();
  } else if (user?.role === "MENTOR") {
    result = await metaService.getMentorOverviewStats(user.userId);
  } else if (user?.role === "STUDENT") {
    result = await metaService.getStudentOverviewStats(user.userId);
  } else {
    throw new Error("Invalid user role");
  }

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Overview stats fetched successfully",
    data: result,
  });
});

export const metaController = {
  getOverviewStats,
};
