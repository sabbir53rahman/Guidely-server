import { Router } from "express";
import { MentorController } from "./mentor.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.get("/", MentorController.getAllMentors);
router.get("/me", checkAuth("MENTOR"), MentorController.getMyMentorProfile);
router.get("/:id", MentorController.getMentorById);
router.patch("/:id", checkAuth("MENTOR", "ADMIN", "SUPER_ADMIN"), MentorController.updateMentor);
router.delete("/:id", checkAuth("ADMIN", "SUPER_ADMIN"), MentorController.deleteMentor);

export const MentorRoutes = router;
