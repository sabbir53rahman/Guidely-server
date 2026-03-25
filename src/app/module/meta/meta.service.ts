import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/appError";
import status from "http-status";

const getAdminOverviewStats = async () => {
  const [totalUsers, totalMentors, totalStudents, totalBookings, totalRevenue] =
    await Promise.all([
      prisma.user.count({ where: { isDeleted: false } }),
      prisma.mentor.count({ where: { isDeleted: false } }),
      prisma.student.count({ where: { isDeleted: false } }),
      prisma.booking.count(),
      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: "PAID",
        },
      }),
    ]);

  const recentBookings = await prisma.booking.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      student: {
        select: {
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
      mentor: {
        select: {
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
    },
  });

  return {
    totalUsers,
    totalMentors,
    totalStudents,
    totalBookings,
    totalRevenue: totalRevenue._sum.amount || 0,
    recentBookings,
  };
};

const getMentorOverviewStats = async (userId: string) => {
  const mentor = await prisma.mentor.findUnique({
    where: {
      userId,
    },
  });

  if (!mentor) {
    throw new AppError(status.NOT_FOUND, "Mentor not found");
  }

  const mentorId = mentor.id;

  const [totalBookings, totalReviews, totalEarnings] = await Promise.all([
    prisma.booking.count({
      where: {
        mentorId,
      },
    }),
    prisma.review.count({
      where: {
        mentorId,
      },
    }),
    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        booking: {
          mentorId,
        },
        status: "PAID",
      },
    }),
  ]);

  const upcomingBookings = await prisma.booking.findMany({
    where: {
      mentorId,
      startTime: {
        gte: new Date(),
      },
      status: "SCHEDULED",
    },
    include: {
      student: {
        select: {
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
    },
    take: 5,
    orderBy: {
      startTime: "asc",
    },
  });

  return {
    totalBookings,
    totalReviews,
    totalEarnings: totalEarnings._sum.amount || 0,
    averageRating: mentor.averageRating,
    upcomingBookings,
  };
};

const getStudentOverviewStats = async (userId: string) => {
  const student = await prisma.student.findUnique({
    where: {
      userId,
    },
  });

  if (!student) {
    throw new AppError(status.NOT_FOUND, "Student not found");
  }

  const studentId = student.id;

  const [totalBookings, totalReviews, totalSpent] = await Promise.all([
    prisma.booking.count({
      where: {
        studentId,
      },
    }),
    prisma.review.count({
      where: {
        studentId,
      },
    }),
    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        booking: {
          studentId,
        },
        status: "PAID",
      },
    }),
  ]);

  const upcomingBookings = await prisma.booking.findMany({
    where: {
      studentId,
      startTime: {
        gte: new Date(),
      },
      status: "SCHEDULED",
    },
    include: {
      mentor: {
        select: {
          name: true,
          email: true,
          profilePhoto: true,
        },
      },
    },
    take: 5,
    orderBy: {
      startTime: "asc",
    },
  });

  return {
    totalBookings,
    totalReviews,
    totalSpent: totalSpent._sum.amount || 0,
    upcomingBookings,
  };
};

export const metaService = {
  getAdminOverviewStats,
  getMentorOverviewStats,
  getStudentOverviewStats,
};
