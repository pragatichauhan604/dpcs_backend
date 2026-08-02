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
  "/pharmacies",
  authenticate,
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    const city = String(req.query.city || "").trim();

    const pharmacies = await prisma.pharmacy.findMany({
      where: {
        isActive: true,
        isApproved: true,
        city: city ? { contains: city } : undefined,
        OR: q
          ? [
              { name: { contains: q } },
              { ownerName: { contains: q } },
              { address: { contains: q } },
              { city: { contains: q } },
              { pincode: { contains: q } },
            ]
          : undefined,
      },
      include: {
        inventory: {
          include: { medicine: true },
          orderBy: { medicineName: "asc" },
          take: 5,
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({ pharmacies });
  }),
);

catalogRoutes.get(
  "/availability",
  authenticate,
  asyncHandler(async (req, res) => {
    const medicineId = String(req.query.medicineId || "");
    const q = String(req.query.q || "").trim();
    const city = String(req.query.city || "");
    const matchedMedicines = q
      ? await prisma.medicine.findMany({
          where: {
            isActive: true,
            OR: [
              { brandName: { contains: q } },
              { genericName: { contains: q } },
              { category: { contains: q } },
            ],
          },
          select: { id: true },
        })
      : [];
    const matchedMedicineIds = matchedMedicines.map((medicine) => medicine.id);

    const inventory = await prisma.pharmacyInventory.findMany({
      where: {
        medicineId: medicineId || undefined,
        OR: q
          ? [
              { medicineName: { contains: q } },
              { medicineId: { in: matchedMedicineIds } },
            ]
          : undefined,
        quantity: { gt: 0 },
        pharmacy: {
          isActive: true,
          isApproved: true,
          city: city ? { contains: city } : undefined,
        },
      },
      include: { pharmacy: true, medicine: true },
      orderBy: { quantity: "desc" },
    });

    res.json({ inventory });
  }),
);
