import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { asyncHandler } from "../utils/asyncHandler";
import { buildPartnerOrderUrl } from "../utils/orderLinks";

export const patientRoutes = Router();

patientRoutes.use(authenticate, authorize("patient"));

const getPatient = async (userId: string) => {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) throw new ApiError(404, "Patient profile not found");
  return patient;
};

patientRoutes.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const patient = await getPatient(req.user!.id);
    const [prescriptions, refillAlerts] = await Promise.all([
      prisma.prescription.findMany({
        where: { patientId: patient.id },
        include: { doctor: { include: { user: true } }, items: true, dispensedRecord: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.refillAlert.findMany({
        where: { patientId: patient.id, isAcknowledged: false },
        include: { prescription: true },
        orderBy: { alertDate: "asc" },
      }),
    ]);

    res.json({ prescriptions, refillAlerts });
  }),
);

patientRoutes.get(
  "/doctors",
  asyncHandler(async (_req, res) => {
    const doctors = await prisma.doctor.findMany({
      where: { isApproved: true, user: { isActive: true } },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { user: { fullName: "asc" } },
    });

    res.json({ doctors });
  }),
);

patientRoutes.get(
  "/prescriptions",
  asyncHandler(async (req, res) => {
    const patient = await getPatient(req.user!.id);
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: { doctor: { include: { user: true } }, items: true, dispensedRecord: { include: { pharmacy: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ prescriptions });
  }),
);

patientRoutes.get(
  "/prescriptions/:id/qr",
  asyncHandler(async (req, res) => {
    const patient = await getPatient(req.user!.id);
    const prescriptionId = String(req.params.id);
    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, patientId: patient.id },
      select: { id: true, qrCode: true, qrCodeToken: true, status: true },
    });
    if (!prescription) throw new ApiError(404, "Prescription not found");

    res.json({ prescription });
  }),
);

patientRoutes.get(
  "/prescriptions/:id/order-link",
  asyncHandler(async (req, res) => {
    const patient = await getPatient(req.user!.id);
    const prescriptionId = String(req.params.id);
    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, patientId: patient.id },
      include: { items: true },
    });
    if (!prescription) throw new ApiError(404, "Prescription not found");

    res.json({ orderUrl: buildPartnerOrderUrl(prescription) });
  }),
);

patientRoutes.post(
  "/prescriptions/:id/refill-request",
  asyncHandler(async (req, res) => {
    const patient = await getPatient(req.user!.id);
    const prescriptionId = String(req.params.id);
    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, patientId: patient.id },
    });
    if (!prescription) throw new ApiError(404, "Prescription not found");

    const alert = await prisma.refillAlert.create({
      data: {
        prescriptionId: prescription.id,
        patientId: patient.id,
        doctorId: prescription.doctorId,
        alertType: "refill_request",
        alertDate: new Date(),
      },
    });

    const doctor = await prisma.doctor.findUnique({ where: { id: prescription.doctorId } });
    if (doctor) {
      await prisma.notification.create({
        data: {
          userId: doctor.userId,
          title: "Refill requested",
          message: "A patient requested a prescription refill.",
          type: "refill",
        },
      });
    }

    res.status(201).json({ alert });
  }),
);
