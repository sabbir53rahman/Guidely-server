import { Router } from "express";
import { MentorController } from "./mentor.controller";

const router = Router();

router.get("/", MentorController.getAllMentors);
router.get("/:id", MentorController.getMentorById);
router.patch("/:id", MentorController.updateMentor);
router.delete("/:id", MentorController.deleteMentor);

export const MentorRoutes = router;
