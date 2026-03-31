import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { ScheduleService } from "./schedule.service";
import pick from "../../utils/pick";
import { scheduleFilterableFields } from "./schedule.constants";
import { IQueryParams } from "../../interfaces/query.interface";

const createSchedule = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await ScheduleService.createSchedule(user, req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Schedule created successfully",
    data: result,
  });
});

const getAllSchedules = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, scheduleFilterableFields) as IQueryParams;
  console.log("Filters applied:", filters);

  const result = await ScheduleService.getAllSchedules(filters);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "All schedules retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getMySchedules = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await ScheduleService.getMySchedules(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Schedules retrieved successfully",
    data: result,
  });
});

const updateSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = req.user;
  const result = await ScheduleService.updateSchedule(id, user, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Schedule updated successfully",
    data: result,
  });
});

const deleteSchedule = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = req.user;
  const result = await ScheduleService.deleteSchedule(id, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Schedule deleted successfully",
    data: result,
  });
});

export const ScheduleController = {
  createSchedule,
  getAllSchedules,
  getMySchedules,
  updateSchedule,
  deleteSchedule,
};
