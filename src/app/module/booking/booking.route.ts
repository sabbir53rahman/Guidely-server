import { Router } from "express";
import { BookingController } from "./booking.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

// Routes requiring authentication
router.post("/", checkAuth("STUDENT"), BookingController.createBooking);
router.get(
  "/me",
  checkAuth("STUDENT", "MENTOR"),
  BookingController.getMyBookings,
);

// General routes (admins or protected differently as needed)
router.get(
  "/",
  checkAuth("ADMIN", "SUPER_ADMIN"),
  BookingController.getAllBookings,
);
router.get(
  "/:id",
  checkAuth("ADMIN", "SUPER_ADMIN", "STUDENT", "MENTOR"),
  BookingController.getBookingById,
);
router.patch(
  "/:id",
  checkAuth("ADMIN", "SUPER_ADMIN", "MENTOR", "STUDENT"),
  BookingController.updateBooking,
);
router.post(
  "/cancel/:id",
  checkAuth("ADMIN", "SUPER_ADMIN", "MENTOR", "STUDENT"),
  BookingController.cancelBooking,
);
router.delete(
  "/:id",
  checkAuth("STUDENT", "ADMIN", "SUPER_ADMIN"),
  BookingController.deleteBooking,
);

export const BookingRoutes = router;
