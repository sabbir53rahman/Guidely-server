import { Router } from "express";
import { PaymentController } from "./payment.controller";
import express from "express";

const router = Router();

router.post("/create-checkout-session", PaymentController.createCheckoutSession);

// Special case for webhook - needs raw body
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleWebhook
);

router.get("/verify-payment", PaymentController.verifyPayment);

export const PaymentRoutes = router;
