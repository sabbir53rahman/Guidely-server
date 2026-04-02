import dotenv from "dotenv";
import AppError from "../app/errorHelpers/appError";
import status from "http-status";

// Load env only when not in production (Vercel already provides env)
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

interface EnvConfig {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  JWT_ACCESS_TOKEN_SECRET: string;
  JWT_ACCESS_TOKEN_EXPIRES_IN: string;
  JWT_REFRESH_TOKEN_SECRET: string;
  JWT_REFRESH_TOKEN_EXPIRES_IN: string;
  BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: string;
  BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: string;
  EMAIL_SENDER: {
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_USER: string;
    SMTP_PASS: string;
    SMTP_FROM: string;
  };
  FRONTEND_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };
  STRIPE: {
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
  };
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
}

const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVariables = [
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "JWT_ACCESS_TOKEN_SECRET",
    "JWT_ACCESS_TOKEN_EXPIRES_IN",
    "JWT_REFRESH_TOKEN_SECRET",
    "JWT_REFRESH_TOKEN_EXPIRES_IN",
    "BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN",
    "BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE",
    "EMAIL_SENDER_SMTP_HOST",
    "EMAIL_SENDER_SMTP_PORT",
    "EMAIL_SENDER_SMTP_USER",
    "EMAIL_SENDER_SMTP_PASS",
    "EMAIL_SENDER_SMTP_FROM",
    "FRONTEND_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CALLBACK_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_PASSWORD",
  ];

  // ✅ Skip validation ONLY during Prisma generate (optional)
  if (process.argv.includes("prisma") || process.env.npm_lifecycle_event === "postinstall") {
    return process.env as unknown as EnvConfig;
  }

  requiredEnvVariables.forEach((variable) => {
    if (!process.env[variable]) {
      throw new AppError(
        status.BAD_REQUEST,
        `Environment variable ${variable} is required but not set`,
      );
    }
  });

  return {
    NODE_ENV: process.env.NODE_ENV!,
    PORT: process.env.PORT!,
    DATABASE_URL: process.env.DATABASE_URL!,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
    JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET!,
    JWT_ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN!,
    JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET!,
    JWT_REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN!,
    BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN:
      process.env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN!,
    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE:
      process.env.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE!,
    EMAIL_SENDER: {
      SMTP_HOST: process.env.EMAIL_SENDER_SMTP_HOST!,
      SMTP_PORT: process.env.EMAIL_SENDER_SMTP_PORT!,
      SMTP_USER: process.env.EMAIL_SENDER_SMTP_USER!,
      SMTP_PASS: process.env.EMAIL_SENDER_SMTP_PASS!,
      SMTP_FROM: process.env.EMAIL_SENDER_SMTP_FROM!,
    },
    FRONTEND_URL: process.env.FRONTEND_URL!,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL!,
    CLOUDINARY: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
    },
    STRIPE: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
    },
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL!,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD!,
  };
};

export const envVars = loadEnvVariables();
