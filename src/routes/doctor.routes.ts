import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { audit } from "../utils/audit";
import { asyncHandler } from "../utils/asyncHandler";
import { createPrescriptionQr } from "../utils/qr";
import { createPrescriptionSchema } from "../validators/prescription";

export const doctorRoutes = Router();

doctorRoutes.use(authenticate, authorize("doctor"));

const getDoctor = async (userId: string) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");
  if (!doctor.isApproved) throw new ApiError(403, "Doctor account is pending approval");
  return doctor;
};

doctorRoutes.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const doctor = await getDoctor(req.user!.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, activePatients, pendingRefills, recentPrescriptions] = await Promise.all([
      prisma.prescription.count({
        where: { doctorId: doctor.id, createdAt: { gte: today } },
      }),
      prisma.prescription.groupBy({
        by: ["patientId"],
        where: { doctorId: doctor.id, status: "active", expiryDate: { gte: new Date() } },
      }),
      prisma.refillAlert.count({
        where: { doctorId: doctor.id, alertType: "expiry_warning", isAcknowledged: false },
      }),
      prisma.prescription.findMany({
        where: { doctorId: doctor.id },
        include: { patient: { include: { user: true } }, items: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    res.json({
      totalPrescriptionsToday: todayCount,
      totalActivePatients: activePatients.length,
      pendingRefillAlerts: pendingRefills,
      recentPrescriptions,
    });
  }),
);

doctorRoutes.get(
  "/patients/search",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || "").trim();

    const patients = await prisma.patient.findMany({
      where: {
        user: q
          ? {
              OR: [
                { fullName: { contains: q } },
                { phone: { contains: q } },
                { email: { contains: q } },
              ],
            }
          : undefined,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        prescriptions: { orderBy: { createdAt: "desc" }, take: 5, include: { items: true } },
      },
      take: 15,
    });

    res.json({ patients });
  }),
);

doctorRoutes.get(
  "/patients",
  asyncHandler(async (req, res) => {
    const doctor = await getDoctor(req.user!.id);
    const prescriptions = await prisma.prescription.findMany({
      where: { doctorId: doctor.id },
      distinct: ["patientId"],
      include: { patient: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ patients: prescriptions.map((item) => item.patient) });
  }),
);

doctorRoutes.post(
  "/prescriptions",
  asyncHandler(async (req, res) => {
    const doctor = await getDoctor(req.user!.id);
    const body = createPrescriptionSchema.parse(req.body);
    const patient = await prisma.patient.findUnique({ where: { id: body.patientId } });
    if (!patient) throw new ApiError(404, "Patient not found");

    const expiryDate = body.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const { token, qrCode } = await createPrescriptionQr();

    const prescription = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.prescription.create({
        data: {
          doctorId: doctor.id,
          patientId: patient.id,
          qrCode,
          qrCodeToken: token,
          issuedDate: new Date(),
          expiryDate,
          notes: body.notes,
          followUpDate: body.followUpDate,
          items: {
            create: body.items.map((item) => ({
              medicineId: item.medicineId,
              medicineName: item.medicineName,
              dosage: item.dosage,
              frequency: item.frequency,
              durationDays: item.durationDays,
              timing: item.timing,
              quantityToTake: item.quantityToTake,
              instructions: item.instructions,
            })),
          },
          refillAlerts: {
            create: {
              patientId: patient.id,
              doctorId: doctor.id,
              alertType: "expiry_warning",
              alertDate: new Date(expiryDate.getTime() - 3 * 24 * 60 * 60 * 1000),
            },
          },
        },
        include: { items: true, patient: { include: { user: true } } },
      });

      await tx.notification.create({
        data: {
          userId: patient.userId,
          title: "New prescription issued",
          message: "A new prescription is available in your patient portal.",
          type: "prescription",
        },
      });

      return created;
    });

    await audit({
      userId: req.user!.id,
      action: "CREATE_PRESCRIPTION",
      entityType: "prescription",
      entityId: prescription.id,
      ipAddress: req.ip,
    });

    res.status(201).json({ prescription });
  }),
);

doctorRoutes.get(
  "/prescriptions",
  asyncHandler(async (req, res) => {
    const doctor = await getDoctor(req.user!.id);
    const prescriptions = await prisma.prescription.findMany({
      where: { doctorId: doctor.id },
      include: { patient: { include: { user: true } }, items: true, dispensedRecord: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ prescriptions });
  }),
);
