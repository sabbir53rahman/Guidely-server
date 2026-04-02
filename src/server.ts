import app from "./app";
import { seedSuperAdmin } from "./app/utils/seed";
import { envVars } from "./config/env";
import { Request, Response } from "express";

// For Vercel serverless deployment
export default async function handler(req: Request, res: Response) {
  await seedSuperAdmin();
  app(req, res);
}

// For local development
if (process.env.NODE_ENV !== "production") {
  const bootstrap = async () => {
    try {
      await seedSuperAdmin();
      app.listen(envVars.PORT, () => {
        console.log(`Server is running on PORT ${envVars.PORT}`);
      });
    } catch (err) {
      console.error("Failed to start server:", err);
    }
  };

  bootstrap();
}
