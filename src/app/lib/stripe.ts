import Stripe from "stripe";
import "dotenv/config";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: "2024-12-18.preview" as any, 
});
