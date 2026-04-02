import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminController } from "./admin.controller";
import { updateAdminZodSchema } from "./admin.validation";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getAllAdmins,
);

router.get(
  "/users",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getAllUsers,
);
router.patch(
  "/users/:userId/role",
  checkAuth(Role.SUPER_ADMIN),
  AdminController.updateUserRole,
);
router.patch(
  "/users/:userId/toggle-status",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.toggleUserStatus,
);
router.delete(
  "/users/:userId",
  checkAuth(Role.SUPER_ADMIN),
  AdminController.deleteUser,
);

router.get(
  "/payments",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getPaymentsOverview,
);

router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getAdminById,
);
router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(updateAdminZodSchema),
  AdminController.updateAdmin,
);
router.delete("/:id", checkAuth(Role.SUPER_ADMIN), AdminController.deleteAdmin);

export const AdminRoutes = router;
