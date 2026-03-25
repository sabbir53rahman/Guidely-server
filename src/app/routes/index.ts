import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { UserRoutes } from "../module/user/user.route";
import { AdminRoutes } from "../module/admin/admin.route";
import { ScheduleRoutes } from "../module/schedule/schedule.route";
import { MentorRoutes } from "../module/mentor/mentor.route";
import { BookingRoutes } from "../module/booking/booking.route";
import { ReviewRoutes } from "../module/review/review.route";
import { PaymentRoutes } from "../module/payment/payment.route";
import { MetaRoutes } from "../module/meta/meta.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/admins", AdminRoutes);
router.use("/mentors", MentorRoutes);
router.use("/schedules", ScheduleRoutes);
router.use("/bookings", BookingRoutes);
router.use("/reviews", ReviewRoutes);
router.use("/payments", PaymentRoutes);
router.use("/meta", MetaRoutes);

export const IndexRoutes = router;
