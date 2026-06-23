import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { asyncHandler } from "../utils/asyncHandler";

export const notificationsRoutes = Router();

notificationsRoutes.use(authenticate);

notificationsRoutes.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ notifications });
  }),
);

notificationsRoutes.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const notificationId = String(req.params.id);
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId: req.user!.id },
    });
    if (!existing) throw new ApiError(404, "Notification not found");

    const notification = await prisma.notification.update({
      where: { id: existing.id },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ notification });
  }),
);
