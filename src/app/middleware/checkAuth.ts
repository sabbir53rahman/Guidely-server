/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import AppError from "../errorHelpers/appError";
import { cookieHelpers } from "../utils/cookie";
import { jwtHelpers } from "../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../../generated/prisma/enums";

export const checkAuth =
  (...authRoles: Role[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken =
        cookieHelpers.getCookie(req, "accessToken") ||
        req.headers.authorization;

      if (!accessToken) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! No access token provided.",
        );
      }

      const verifiedToken = jwtHelpers.verifyToken(
        accessToken.startsWith("Bearer ")
          ? accessToken.split(" ")[1]
          : accessToken,
        envVars.JWT_ACCESS_TOKEN_SECRET,
      );

      if (!verifiedToken.success) {
        throw new AppError(
          status.UNAUTHORIZED,
          "Unauthorized access! Invalid access token.",
        );
      }

      const user = verifiedToken.data;

      if (authRoles.length > 0 && !authRoles.includes(user!.role as Role)) {
        throw new AppError(
          status.FORBIDDEN,
          "Forbidden access! You do not have permission to access this resource.",
        );
      }

      req.user = {
        userId: user!.userId,
        role: user!.role,
        email: user!.email,
      };

      next();
    } catch (error: any) {
      next(error);
    }
  };
