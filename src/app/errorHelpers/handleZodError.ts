import z from "zod";
import { TErrorResponse, TErrorSources } from "../interfaces/error.interface";
import status from "http-status";

export const handleZodError = (error: z.ZodError): TErrorResponse => {
  const statusCode = status.BAD_REQUEST;
  const message = "Zod Validation Error";

  const errorSources: TErrorSources[] = [];

  error.issues.forEach((issue) => {
    errorSources.push({
      path: issue.path.join(".") || "unknown",
      message: issue.message,
    });
  });

  const errorResponse: TErrorResponse = {
    success: false,
    statusCode,
    message,
    errorSources,
  };

  return errorResponse;
};
