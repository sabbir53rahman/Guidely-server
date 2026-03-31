import { Router } from "express";
import { ReviewController } from "./review.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.post("/", checkAuth("STUDENT"), ReviewController.createReview);
router.get("/me", checkAuth("STUDENT", "MENTOR"), ReviewController.getMyReviews);
router.get("/mentor/:mentorId", ReviewController.getMentorReviews);

export const ReviewRoutes = router;
