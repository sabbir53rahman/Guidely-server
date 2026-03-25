import express from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma";
import { metaController } from "./meta.controller";

const router = express.Router();

router.get(
  "/overview",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.MENTOR, Role.STUDENT),
  metaController.getOverviewStats
);

export const MetaRoutes = router;
