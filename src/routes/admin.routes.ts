import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { asyncHandler } from "../utils/asyncHandler";
import { approvalSchema, medicineSchema } from "../validators/admin";
import { createPharmacySchema } from "../validators/pharmacy";

export const adminRoutes = Router();

adminRoutes.use(authenticate, authorize("admin"));

adminRoutes.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      doctors,
      patients,
      prescriptionsToday,
      activePharmacies,
      pendingDoctors,
      pendingPharmacies,
      recentActivity,
      topMedicines,
    ] = await Promise.all([
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.prescription.count({ where: { createdAt: { gte: today } } }),
      prisma.pharmacy.count({ where: { isActive: true, isApproved: true } }),
      prisma.doctor.count({ where: { isApproved: false } }),
      prisma.pharmacy.count({ where: { isApproved: false } }),
      prisma.auditLog.findMany({
        include: { user: { select: { fullName: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.prescriptionItem.groupBy({
        by: ["medicineName"],
        _count: { medicineName: true },
        orderBy: { _count: { medicineName: "desc" } },
        take: 10,
      }),
    ]);

    res.json({
      totalRegisteredDoctors: doctors,
      totalRegisteredPatients: patients,
      totalPrescriptionsToday: prescriptionsToday,
      activePharmacies,
      pendingApprovals: { doctors: pendingDoctors, pharmacies: pendingPharmacies },
      recentActivity,
      topMedicines,
    });
  }),
);

adminRoutes.get(
  "/doctors",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "");

    const doctors = await prisma.doctor.findMany({
      where: {
        isApproved: status === "pending" ? false : status === "active" ? true : undefined,
        OR: q
          ? [
              { user: { fullName: { contains: q } } },
              { specialization: { contains: q } },
              { hospitalName: { contains: q } },
              { licenseNumber: { contains: q } },
            ]
          : undefined,
      },
      include: { user: true, prescriptions: { select: { id: true } } },
      orderBy: { user: { fullName: "asc" } },
    });

    res.json({ doctors });
  }),
);

adminRoutes.patch(
  "/doctors/:id/approval",
  asyncHandler(async (req, res) => {
    const body = approvalSchema.parse(req.body);
    const doctorId = String(req.params.id);
    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        isApproved: body.isApproved,
        approvedAt: body.isApproved ? new Date() : null,
        user: { update: { isActive: body.isApproved } },
      },
      include: { user: true },
    });

    res.json({ doctor });
  }),
);

adminRoutes.get(
  "/patients",
  asyncHandler(async (_req, res) => {
    const patients = await prisma.patient.findMany({
      include: { user: true, prescriptions: { select: { id: true, status: true } } },
      orderBy: { user: { fullName: "asc" } },
    });

    res.json({ patients });
  }),
);

adminRoutes.post(
  "/pharmacies",
  asyncHandler(async (req, res) => {
    const body = createPharmacySchema.parse(req.body);
    const pharmacy = await prisma.pharmacy.create({ data: body });
    res.status(201).json({ pharmacy });
  }),
);

adminRoutes.get(
  "/pharmacies",
  asyncHandler(async (_req, res) => {
    const pharmacies = await prisma.pharmacy.findMany({
      include: { pharmacists: { include: { user: true } }, inventory: true },
      orderBy: { name: "asc" },
    });

    res.json({ pharmacies });
  }),
);

adminRoutes.patch(
  "/pharmacies/:id/approval",
  asyncHandler(async (req, res) => {
    const body = approvalSchema.parse(req.body);
    const pharmacyId = String(req.params.id);
    const pharmacy = await prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: { isApproved: body.isApproved, isActive: body.isApproved },
    });

    res.json({ pharmacy });
  }),
);

adminRoutes.get(
  "/pharmacists",
  asyncHandler(async (_req, res) => {
    const pharmacists = await prisma.pharmacist.findMany({
      include: { user: true, pharmacy: true },
      orderBy: { user: { fullName: "asc" } },
    });

    res.json({ pharmacists });
  }),
);

adminRoutes.patch(
  "/pharmacists/:id/approval",
  asyncHandler(async (req, res) => {
    const body = approvalSchema.parse(req.body);
    const pharmacistId = String(req.params.id);
    const pharmacist = await prisma.pharmacist.update({
      where: { id: pharmacistId },
      data: {
        isApproved: body.isApproved,
        user: { update: { isActive: body.isApproved } },
      },
      include: { user: true, pharmacy: true },
    });

    res.json({ pharmacist });
  }),
);

adminRoutes.get(
  "/prescriptions",
  asyncHandler(async (_req, res) => {
    const prescriptions = await prisma.prescription.findMany({
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } },
        items: true,
        dispensedRecord: { include: { pharmacy: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ prescriptions });
  }),
);

adminRoutes.post(
  "/medicines",
  asyncHandler(async (req, res) => {
    const body = medicineSchema.parse(req.body);
    const medicine = await prisma.medicine.create({ data: body });
    res.status(201).json({ medicine });
  }),
);

adminRoutes.patch(
  "/medicines/:id",
  asyncHandler(async (req, res) => {
    const body = medicineSchema.partial().parse(req.body);
    const medicineId = String(req.params.id);
    const medicine = await prisma.medicine.update({
      where: { id: medicineId },
      data: body,
    });

    res.json({ medicine });
  }),
);

adminRoutes.get(
  "/reports/audit-logs",
  asyncHandler(async (_req, res) => {
    const auditLogs = await prisma.auditLog.findMany({
      include: { user: { select: { fullName: true, role: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    res.json({ auditLogs });
  }),
);
