import { prisma } from "../../lib/prisma";

const getMyProfile = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      mentor: true,
      student: true,
      admin: true,
    },
  });
  return result;
};

export const UserService = {
  getMyProfile,
};
