import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PaymentService } from "./payment.service";

const createCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId } = req.body;
    const result = await PaymentService.createCheckoutSession(bookingId);

    sendResponse(res, {
      httpStatusCode: status.OK,
      success: true,
      message: "Payment session created successfully",
      data: { paymentSessionUrl: result },
    });
  },
);

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  const payload = req.body; // In express webhook context, this should be the raw body or controlled by express.raw()

  const result = await PaymentService.handleWebhook(payload, signature);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Webhook event handled successfully",
    data: result,
  });
});

const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.query as { sessionId: string };
  const result = await PaymentService.verifyPayment(sessionId);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Payment verified successfully",
    data: result,
  });
});

export const PaymentController = {
  createCheckoutSession,
  handleWebhook,
  verifyPayment,
};
