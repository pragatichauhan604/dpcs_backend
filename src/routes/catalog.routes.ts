import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const catalogRoutes = Router();

catalogRoutes.get(
  "/medicines",
  authenticate,
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    const medicines = await prisma.medicine.findMany({
      where: {
        isActive: true,
        OR: q
          ? [
              { brandName: { contains: q } },
              { genericName: { contains: q } },
            ]
          : undefined,
      },
      orderBy: { brandName: "asc" },
      take: 25,
    });

    res.json({ medicines });
  }),
);

catalogRoutes.get(
  "/availability",
  authenticate,
  asyncHandler(async (req, res) => {
    const medicineId = String(req.query.medicineId || "");
    const city = String(req.query.city || "");

    const inventory = await prisma.pharmacyInventory.findMany({
      where: {
        medicineId: medicineId || undefined,
        quantity: { gt: 0 },
        pharmacy: {
          isActive: true,
          isApproved: true,
          city: city || undefined,
        },
      },
      include: { pharmacy: true, medicine: true },
      orderBy: { quantity: "desc" },
    });

    res.json({ inventory });
  }),
);
