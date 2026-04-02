import status from "http-status";
import { prisma } from "../../lib/prisma";
import { IUpdateAdminPayload } from "./admin.interface";
import AppError from "../../errorHelpers/appError";
import { IRequestUser } from "../../interfaces/requestUser.interface";
import { IQueryParams } from "../../interfaces/query.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { adminSearchableFields } from "./admin.constants";
import { userSafeSelect } from "../user/user.constants";
import { Admin, User } from "../../../generated/prisma/client";
import { Role, UserStatus } from "../../../generated/prisma/enums";

const getAllAdmins = async (queryParams: IQueryParams) => {
  const queryBuilder = new QueryBuilder<Admin>(prisma.admin, queryParams, {
    searchableFields: adminSearchableFields,
  })
    .search()
    .filter()
    .paginate()
    .sort()
    .where({ isDeleted: false })
    .include({ user: { select: userSafeSelect } });

  const result = await queryBuilder.execute();
  return result;
};

const getAdminById = async (id: string) => {
  const admin = await prisma.admin.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: userSafeSelect,
      },
    },
  });
  return admin;
};

const updateAdmin = async (id: string, payload: IUpdateAdminPayload) => {
  //TODO: Validate who is updating the admin user. Only super admin can update admin user and only super admin can update super admin user but admin user cannot update super admin user

  const isAdminExist = await prisma.admin.findUnique({
    where: {
      id,
    },
  });

  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
  }

  const { admin } = payload;

  const updatedAdmin = await prisma.admin.update({
    where: {
      id,
    },
    data: {
      ...admin,
    },
  });

  return updatedAdmin;
};

//soft delete admin user by setting isDeleted to true and also delete the user session and account
const deleteAdmin = async (id: string, user: IRequestUser) => {
  //TODO: Validate who is deleting the admin user. Only super admin can delete admin user and only super admin can delete super admin user but admin user cannot delete super admin user

  const isAdminExist = await prisma.admin.findUnique({
    where: {
      id,
    },
  });

  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
  }

  if (isAdminExist.id === user.userId) {
    throw new AppError(status.BAD_REQUEST, "You cannot delete yourself");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.admin.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await tx.user.update({
      where: { id: isAdminExist.userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: UserStatus.DELETED,
      },
    });

    const admin = await getAdminById(id);

    return admin;
  });

  return result;
};

const getAllUsers = async (filters: IQueryParams, options: IQueryParams) => {
  const queryBuilder = new QueryBuilder<User>(
    prisma.user,
    { ...filters, ...options },
    {
      searchableFields: ["name", "email"],
    },
  )
    .search()
    .filter()
    .paginate()
    .sort()
    .where({ isDeleted: false })
    .include({
      mentor: {
        select: {
          id: true,
          expertise: true,
          experience: true,
          averageRating: true,
          hourlyRate: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
    });

  const result = await queryBuilder.execute();
  return result;
};

const updateUserRole = async (userId: string, role: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (!Object.values(Role).includes(role as Role)) {
    throw new AppError(status.BAD_REQUEST, "Invalid role");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: role as Role },
    select: userSafeSelect,
  });

  return updatedUser;
};

const toggleUserStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (user.isDeleted) {
    throw new AppError(
      status.BAD_REQUEST,
      "Cannot toggle status of deleted user",
    );
  }

  const newStatus =
    user.status === UserStatus.ACTIVE ? UserStatus.BLOCKED : UserStatus.ACTIVE;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: newStatus },
    select: userSafeSelect,
  });

  return updatedUser;
};

const deleteUser = async (userId: string, currentUser: IRequestUser) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(status.NOT_FOUND, "User not found");
  }

  if (user.id === currentUser.userId) {
    throw new AppError(status.BAD_REQUEST, "You cannot delete yourself");
  }

  if (user.isDeleted) {
    throw new AppError(status.BAD_REQUEST, "User is already deleted");
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: UserStatus.DELETED,
      },
    });

    if (user.role === Role.MENTOR) {
      await tx.mentor.update({
        where: { userId },
        data: {
          isDeleted: true,
        },
      });
    }

    if (user.role === Role.STUDENT) {
      await tx.student.update({
        where: { userId },
        data: {
          isDeleted: true,
        },
      });
    }

    if (user.role === Role.ADMIN) {
      await tx.admin.update({
        where: { userId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    }

    const deletedUser = await tx.user.findUnique({
      where: { id: userId },
      select: userSafeSelect,
    });

    return deletedUser;
  });

  return result;
};

const getPaymentsOverview = async () => {
  // Get all paid payments with booking details
  const payments = await prisma.payment.findMany({
    where: { status: "PAID" },
    include: {
      booking: {
        include: {
          student: {
            select: { name: true },
          },
          mentor: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate total revenue
  const totalRevenue = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  // Calculate monthly revenue for the last 12 months with proper month names
  const monthlyRevenue: { month: string; year: number; revenue: number }[] = [];
  const currentDate = new Date();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Initialize monthly revenue for the last 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1,
    );
    monthlyRevenue.push({
      month: monthNames[date.getMonth()],
      year: date.getFullYear(),
      revenue: 0,
    });
  }

  // Calculate revenue for each month
  payments.forEach((payment) => {
    const paymentDate = new Date(payment.createdAt);
    const monthsDiff =
      currentDate.getMonth() -
      paymentDate.getMonth() +
      (currentDate.getFullYear() - paymentDate.getFullYear()) * 12;

    if (monthsDiff >= 0 && monthsDiff < 12) {
      const index = 11 - monthsDiff;
      monthlyRevenue[index].revenue += payment.amount;
    }
  });

  // Get recent transactions (last 10)
  const recentTransactions = payments.slice(0, 10).map((payment) => ({
    id: payment.id,
    amount: payment.amount,
    student: payment.booking.student.name,
    mentor: payment.booking.mentor.name,
    date: payment.createdAt.toISOString(),
  }));

  return {
    totalRevenue,
    monthlyRevenue,
    recentTransactions,
  };
};

export const AdminService = {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getPaymentsOverview,
};
