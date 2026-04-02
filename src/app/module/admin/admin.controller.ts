import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AdminService } from "./admin.service";
import pick from "../../utils/pick";
import { adminFilterableFields } from "./admin.constants";
import { IQueryParams } from "../../interfaces/query.interface";

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, adminFilterableFields) as IQueryParams;
  const result = await AdminService.getAllAdmins(filters);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Admins fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAdminById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const admin = await AdminService.getAdminById(id as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Admin fetched successfully",
    data: admin,
  });
});

const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;

  const updatedAdmin = await AdminService.updateAdmin(id as string, payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Admin updated successfully",
    data: updatedAdmin,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  const result = await AdminService.deleteAdmin(id as string, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Admin deleted successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["role", "searchTerm", "status"]) as IQueryParams;
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]) as IQueryParams;

  const result = await AdminService.getAllUsers(filters, options);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Users fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;

  const result = await AdminService.updateUserRole(userId as string, role);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User role updated successfully",
    data: result,
  });
});

const toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await AdminService.toggleUserStatus(userId as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User status toggled successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = req.user;

  const result = await AdminService.deleteUser(userId as string, user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const getPaymentsOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getPaymentsOverview();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Payments overview fetched successfully",
    data: result,
  });
});

export const AdminController = {
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  getAdminById,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getPaymentsOverview,
};
