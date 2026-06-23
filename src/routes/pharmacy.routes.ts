import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { audit } from "../utils/audit";
import { asyncHandler } from "../utils/asyncHandler";
import { dispenseSchema, inventoryUpsertSchema } from "../validators/pharmacy";

export const pharmacyRoutes = Router();

pharmacyRoutes.use(authenticate, authorize("pharmacist"));

const getPharmacist = async (userId: string) => {
  const pharmacist = await prisma.pharmacist.findUnique({
    where: { userId },
    include: { pharmacy: true },
  });

  if (!pharmacist) throw new ApiError(404, "Pharmacist profile not found");
  if (!pharmacist.isApproved) throw new ApiError(403, "Pharmacist account is pending approval");
  if (!pharmacist.pharmacy.isApproved || !pharmacist.pharmacy.isActive) {
    throw new ApiError(403, "Pharmacy is not active");
  }

  return pharmacist;
};

pharmacyRoutes.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const pharmacist = await getPharmacist(req.user!.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [dispensedToday, allInventory, inventory] = await Promise.all([
      prisma.dispensedRecord.findMany({
        where: { pharmacyId: pharmacist.pharmacyId, dispensedAt: { gte: today } },
        include: { prescription: { include: { patient: { include: { user: true } } } } },
        orderBy: { dispensedAt: "desc" },
      }),
      prisma.pharmacyInventory.findMany({
        where: { pharmacyId: pharmacist.pharmacyId },
        include: { medicine: true },
      }),
      prisma.pharmacyInventory.findMany({
        where: { pharmacyId: pharmacist.pharmacyId },
        include: { medicine: true },
        orderBy: { medicineName: "asc" },
        take: 20,
      }),
    ]);

    const lowStock = allInventory.filter((item) => item.quantity <= item.reorderLevel);

    res.json({ dispensedToday, lowStock, inventory });
  }),
);

pharmacyRoutes.get(
  "/prescriptions/scan/:token",
  asyncHandler(async (req, res) => {
    await getPharmacist(req.user!.id);
    const token = String(req.params.token);
    const prescription = await prisma.prescription.findUnique({
      where: { qrCodeToken: token },
      include: {
        doctor: { include: { user: { select: { fullName: true, phone: true } } } },
        patient: { include: { user: { select: { fullName: true, phone: true } } } },
        items: true,
        dispensedRecord: true,
      },
    });

    if (!prescription) throw new ApiError(404, "Prescription not found");
    res.json({ prescription });
  }),
);

pharmacyRoutes.post(
  "/prescriptions/:id/dispense",
  asyncHandler(async (req, res) => {
    const pharmacist = await getPharmacist(req.user!.id);
    const body = dispenseSchema.parse(req.body);
    const prescriptionId = String(req.params.id);
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { items: true, patient: true },
    });

    if (!prescription) throw new ApiError(404, "Prescription not found");
    if (prescription.status !== "active") {
      throw new ApiError(409, "Only active prescriptions can be dispensed");
    }

    const record = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const item of prescription.items) {
        if (!item.medicineId) continue;

        const stock = await tx.pharmacyInventory.findFirst({
          where: {
            pharmacyId: pharmacist.pharmacyId,
            medicineId: item.medicineId,
            quantity: { gt: 0 },
          },
          orderBy: { expiryDate: "asc" },
        });

        if (stock) {
          await tx.pharmacyInventory.update({
            where: { id: stock.id },
            data: {
              quantity: Math.max(0, stock.quantity - 1),
              updatedBy: req.user!.id,
            },
          });
        }
      }

      await tx.prescription.update({
        where: { id: prescription.id },
        data: { status: body.status === "rejected" ? "active" : "dispensed" },
      });

      const dispensed = await tx.dispensedRecord.create({
        data: {
          prescriptionId: prescription.id,
          pharmacyId: pharmacist.pharmacyId,
          pharmacistId: pharmacist.id,
          status: body.status,
          notes: body.notes,
          partialReason: body.partialReason,
        },
        include: { pharmacy: true, pharmacist: { include: { user: true } } },
      });

      await tx.notification.create({
        data: {
          userId: prescription.patient.userId,
          title: "Medicines dispensed",
          message: "Your prescription has been updated by the pharmacy.",
          type: "dispense",
        },
      });

      return dispensed;
    });

    await audit({
      userId: req.user!.id,
      action: "DISPENSE_PRESCRIPTION",
      entityType: "prescription",
      entityId: prescription.id,
      ipAddress: req.ip,
    });

    res.status(201).json({ record });
  }),
);

pharmacyRoutes.get(
  "/inventory",
  asyncHandler(async (req, res) => {
    const pharmacist = await getPharmacist(req.user!.id);
    const inventory = await prisma.pharmacyInventory.findMany({
      where: { pharmacyId: pharmacist.pharmacyId },
      include: { medicine: true },
      orderBy: { medicineName: "asc" },
    });

    res.json({ inventory });
  }),
);

pharmacyRoutes.post(
  "/inventory",
  asyncHandler(async (req, res) => {
    const pharmacist = await getPharmacist(req.user!.id);
    const body = inventoryUpsertSchema.parse(req.body);
    const medicine = await prisma.medicine.findUnique({ where: { id: body.medicineId } });
    if (!medicine) throw new ApiError(404, "Medicine not found");

    const inventory = await prisma.pharmacyInventory.create({
      data: {
        pharmacyId: pharmacist.pharmacyId,
        medicineId: medicine.id,
        medicineName: medicine.brandName,
        quantity: body.quantity,
        batchNumber: body.batchNumber,
        unitPrice: body.unitPrice,
        expiryDate: body.expiryDate,
        reorderLevel: body.reorderLevel,
        updatedBy: req.user!.id,
      },
    });

    res.status(201).json({ inventory });
  }),
);

pharmacyRoutes.patch(
  "/inventory/:id",
  asyncHandler(async (req, res) => {
    const pharmacist = await getPharmacist(req.user!.id);
    const body = inventoryUpsertSchema.partial().parse(req.body);
    const inventoryId = String(req.params.id);
    const existing = await prisma.pharmacyInventory.findFirst({
      where: { id: inventoryId, pharmacyId: pharmacist.pharmacyId },
    });
    if (!existing) throw new ApiError(404, "Inventory record not found");

    const inventory = await prisma.pharmacyInventory.update({
      where: { id: existing.id },
      data: { ...body, updatedBy: req.user!.id },
    });

    res.json({ inventory });
  }),
);
