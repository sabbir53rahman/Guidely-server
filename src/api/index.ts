import app from "../app";
import { Request, Response } from "express";

// Vercel serverless function handler
export default async function handler(req: Request, res: Response) {
  try {
    // Handle the request with Express app
    app(req, res);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
