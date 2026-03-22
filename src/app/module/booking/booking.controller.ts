import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { BookingService } from "./booking.service";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await BookingService.createBooking(user, req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Booking created successfully",
    data: result,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const result = await BookingService.getAllBookings();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Bookings retrieved successfully",
    data: result,
  });
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await BookingService.getMyBookings(user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Your bookings retrieved successfully",
    data: result,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await BookingService.getBookingById(id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Booking retrieved successfully",
    data: result,
  });
});

const updateBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await BookingService.updateBooking(id, req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Booking updated successfully",
    data: result,
  });
});

const deleteBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const result = await BookingService.deleteBooking(id);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Booking deleted successfully",
    data: result,
  });
});

export const BookingController = {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
