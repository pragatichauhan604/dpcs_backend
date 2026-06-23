import { NextFunction, Request, Response } from "express";
import { verifyToken, JwtUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { ApiError } from "./error";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return next(new ApiError(401, "Authentication token required"));
  }

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || !user.isActive) {
      throw new ApiError(401, "Account is inactive or no longer exists");
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, "Invalid token"));
  }
};

export const authorize =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Access denied"));
    }

    next();
  };
