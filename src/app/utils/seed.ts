import { envVars } from "../../config/env";
import { Role } from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await prisma.user.findFirst({
      where: {
        role: Role.SUPER_ADMIN,
      },
    });

    if (isSuperAdminExist) {
      console.log("Super admin already exists. Skipping seeding super admin.");
      return;
    }

    const hashedPassword = await bcrypt.hash(envVars.SUPER_ADMIN_PASSWORD, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: envVars.SUPER_ADMIN_EMAIL,
          password: hashedPassword,
          name: "Super Admin",
          role: Role.SUPER_ADMIN,
          needsPasswordChange: false,
        },
      });

      await tx.admin.create({
        data: {
          userId: user.id,
          name: "Super Admin",
          email: envVars.SUPER_ADMIN_EMAIL,
        },
      });
    });

    console.log("Super Admin Created successfully");
  } catch (error) {
    console.error("Error seeding super admin: ", error);
  }
};
