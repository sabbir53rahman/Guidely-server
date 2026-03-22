import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { UserRoutes } from "../module/user/user.route";
import { AdminRoutes } from "../module/admin/admin.route";
import { ScheduleRoutes } from "../module/schedule/schedule.route";
import { MentorRoutes } from "../module/mentor/mentor.route";
import { BookingRoutes } from "../module/booking/booking.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/admins", AdminRoutes);
router.use("/mentors", MentorRoutes);
router.use("/schedules", ScheduleRoutes);
router.use("/bookings", BookingRoutes);

export const IndexRoutes = router;
