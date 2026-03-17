import status from "http-status";
import { UserStatus } from "../../../generated/prisma";
import AppError from "../../errorHelpers/appError";
import { prisma } from "../../lib/prisma";
import { tokenHelpers } from "../../utils/token";
import bcrypt from "bcryptjs";
import {
  ILoginUserPayload,
  IRegisterMentorPayload,
  IRegisterStudentPayload,
} from "./auth.interface";

const registerStudent = async (payload: IRegisterStudentPayload) => {
  const { name, email, password } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist) {
    throw new AppError(
      status.BAD_REQUEST,
      "User already exists with this email",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "STUDENT",
      },
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        name,
        email,
      },
    });

    return { user, student };
  });

  const accessToken = tokenHelpers.getAccessToken({
    userId: result.user.id,
    email: result.user.email,
    role: result.user.role,
    name: result.user.name,
  });

  const refreshToken = tokenHelpers.getRefreshToken({
    userId: result.user.id,
    email: result.user.email,
    role: result.user.role,
    name: result.user.name,
  });

  return {
    ...result,
    accessToken,
    refreshToken,
  };
};

const registerMentor = async (payload: IRegisterMentorPayload) => {
  const { name, email, password } = payload;

  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist) {
    throw new AppError(
      status.BAD_REQUEST,
      "User already exists with this email",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "MENTOR",
      },
    });

    const mentor = await tx.mentor.create({
      data: {
        userId: user.id,
        name,
        email,
      },
    });

    return { user, mentor };
  });

  const accessToken = tokenHelpers.getAccessToken({
    userId: result.user.id,
    email: result.user.email,
    role: result.user.role,
    name: result.user.name,
  });

  const refreshToken = tokenHelpers.getRefreshToken({
    userId: result.user.id,
    email: result.user.email,
    role: result.user.role,
    name: result.user.name,
  });

  return {
    ...result,
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: ILoginUserPayload) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (user.isDeleted) {
    throw new AppError(status.FORBIDDEN, "User is deleted");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new AppError(status.FORBIDDEN, "User is blocked");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new AppError(status.UNAUTHORIZED, "Invalid password");
  }

  const accessToken = tokenHelpers.getAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  const refreshToken = tokenHelpers.getRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const authService = {
  registerStudent,
  registerMentor,
  loginUser,
};
