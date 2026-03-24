import { prisma } from "../../lib/prisma";
import { userSafeSelect } from "./user.constants";

const getMyProfile = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userSafeSelect,
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
