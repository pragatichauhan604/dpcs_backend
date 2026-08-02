import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { asyncHandler } from "../utils/asyncHandler";
import { buildPartnerOrderUrl } from "../utils/orderLinks";
import { createPrescriptionPdf } from "../utils/prescriptionPdf";

export const patientRoutes = Router();

patientRoutes.use(authenticate, authorize("patient"));

const getPatient = async (userId: string) => {
  const patient = await prisma.patient.findUnique({ where: { userId }, include: { user: true } });
  if (!patient) throw new ApiError(404, "Patient profile not found");
  return patient;
};

const appointmentSchema = z.object({
  doctorId: z.string().uuid(),
  preferredDate: z.coerce.date(),
  reason: z.string().min(3).max(300),
});

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
  asyncHandler(async (req, res) => {
    const patient = await getPatient(req.user!.id);
    const q = String(req.query.q || "").trim();
    const doctors = await prisma.doctor.findMany({
      where: {
        isApproved: true,
        user: { isActive: true },
        OR: q
          ? [
              { user: { fullName: { contains: q } } },
              { specialization: { contains: q } },
              { hospitalName: { contains: q } },
              { city: { contains: q } },
              { prescriptions: { some: { patientId: patient.id, disease: { contains: q } } } },
            ]
          : undefined,
      },
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
        prescriptions: {
          where: { patientId: patient.id, disease: { not: null } },
          select: { disease: true, issuedDate: true },
          orderBy: { issuedDate: "desc" },
          take: 3,
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
  "/prescriptions/:id/pdf",
  asyncHandler(async (req, res) => {
    const patient = await getPatient(req.user!.id);
    const prescriptionId = String(req.params.id);
    const prescription = await prisma.prescription.findFirst({
      where: { id: prescriptionId, patientId: patient.id },
      include: {
        doctor: { include: { user: { select: { fullName: true, phone: true } } } },
        patient: { include: { user: { select: { fullName: true, phone: true } } } },
        items: true,
      },
    });
    if (!prescription) throw new ApiError(404, "Prescription not found");

    const pdf = createPrescriptionPdf(prescription);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="prescription-${prescription.id}.pdf"`);
    res.send(pdf);
  }),
);

patientRoutes.post(
  "/appointments",
  asyncHandler(async (req, res) => {
    const patient = await getPatient(req.user!.id);
    const body = appointmentSchema.parse(req.body);
    const doctor = await prisma.doctor.findFirst({
      where: { id: body.doctorId, isApproved: true, user: { isActive: true } },
      include: { user: true },
    });
    if (!doctor) throw new ApiError(404, "Doctor not found");

    const appointmentId = randomUUID();
    const appointment = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO appointments (id, patient_id, doctor_id, requested_date, reason, status)
        VALUES (${appointmentId}, ${patient.id}, ${doctor.id}, ${body.preferredDate}, ${body.reason}, 'requested')
      `;

      await tx.notification.create({
        data: {
          userId: doctor.userId,
          title: "Appointment requested",
          message: `${patient.user.fullName} requested appointment on ${body.preferredDate.toLocaleString("en-IN")}. Reason: ${body.reason}`,
          type: "system",
        },
      });

      return {
        id: appointmentId,
        doctorId: doctor.id,
        patientId: patient.id,
        requestedDate: body.preferredDate,
        reason: body.reason,
        status: "requested",
      };
    });

    res.status(201).json({
      appointment,
    });
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
