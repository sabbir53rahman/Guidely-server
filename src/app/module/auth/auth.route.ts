import { Router } from "express";
import { authController } from "./auth.controller";

const router = Router();

router.post("/register-student", authController.registerStudent);
router.post("/register-mentor", authController.registerMentor);
router.post("/login", authController.loginUser);

export const AuthRoutes = router;
