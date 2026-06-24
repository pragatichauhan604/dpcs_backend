import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, "Route not found"));
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ZodError) {
    return res.status(422).json({
      message: "Validation failed",
      errors: error.flatten(),
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: duplicateMessage(error.meta?.target) });
    }

    if (error.code === "P2003") {
      return res.status(400).json({ message: "Related master data is missing. Please run database seed first." });
    }
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
};

function duplicateMessage(target: unknown) {
  const raw = Array.isArray(target) ? target.join(", ") : typeof target === "string" ? target : "";
  const normalized = raw.toLowerCase();

  if (normalized.includes("email")) return "This email is already registered. Please login or use another email.";
  if (normalized.includes("license")) return "This license number is already registered. Please use a different license number.";
  if (normalized.includes("qr_code_token")) return "Could not generate a unique QR code. Please try again.";
  if (normalized.includes("prescription_id")) return "This prescription has already been dispensed.";
  if (normalized.includes("pharmacy_id") && normalized.includes("medicine_id")) {
    return "This medicine batch already exists in the pharmacy inventory.";
  }
  if (normalized.includes("user_id")) return "This account already has a profile for this role.";

  return "This record already exists. Please check the details and try again.";
}
