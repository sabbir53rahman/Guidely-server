import { Router } from "express";
import { UserController } from "./user.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.get("/me", checkAuth(), UserController.getMyProfile);

export const UserRoutes = router;
