import { Router } from "express";
import { ScheduleController } from "./schedule.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.post("/", checkAuth("MENTOR"), ScheduleController.createSchedule);
router.get("/", ScheduleController.getAllSchedules);
router.get("/me", checkAuth("MENTOR"), ScheduleController.getMySchedules);
router.patch("/:id", checkAuth("MENTOR"), ScheduleController.updateSchedule);
router.delete("/:id", checkAuth("MENTOR"), ScheduleController.deleteSchedule);

export const ScheduleRoutes = router;
