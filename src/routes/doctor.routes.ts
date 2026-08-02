import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { audit } from "../utils/audit";
import { asyncHandler } from "../utils/asyncHandler";
import { createPrescriptionQr } from "../utils/qr";
import { createPrescriptionSchema, updatePrescriptionSchema } from "../validators/prescription";

export const doctorRoutes = Router();

doctorRoutes.use(authenticate, authorize("doctor"));

const PRESCRIPTION_EDIT_WINDOW_MINUTES = Number(process.env.PRESCRIPTION_EDIT_WINDOW_MINUTES || 30);

const getDoctor = async (userId: string) => {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new ApiError(404, "Doctor profile not found");
  if (!doctor.isApproved) throw new ApiError(403, "Doctor account is pending approval");
  return doctor;
};

const scheduleAppointmentSchema = z.object({
  scheduledAt: z.coerce.date(),
  doctorNote: z.string().max(1000).optional(),
});

const refillResponseSchema = z.object({
  status: z.string().refine((value) => ["approved", "rejected"].includes(value), {
    message: "Status must be approved or rejected",
  }),
  doctorNote: z.string().max(1000).optional(),
});

type AppointmentRequestRow = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  requestedDate: Date;
  reason: string;
  status: string;
  scheduledAt: Date | null;
  doctorNote: string | null;
  createdAt: Date;
};

type RefillRequestRow = {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  alertDate: Date;
  status: string;
  doctorNote: string | null;
  respondedAt: Date | null;
  disease: string | null;
  issuedDate: Date;
  expiryDate: Date;
};

doctorRoutes.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const doctor = await getDoctor(req.user!.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, activePatients, pendingRefills, recentPrescriptions, appointmentRequests] = await Promise.all([
      prisma.prescription.count({
        where: { doctorId: doctor.id, createdAt: { gte: today } },
      }),
      prisma.prescription.groupBy({
        by: ["patientId"],
        where: { doctorId: doctor.id, status: "active", expiryDate: { gte: new Date() } },
      }),
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) AS count
        FROM refill_alerts
        WHERE doctor_id = ${doctor.id}
          AND alert_type = 'refill_request'
          AND status = 'requested'
      `,
      prisma.prescription.findMany({
        where: { doctorId: doctor.id },
        include: { patient: { include: { user: true } }, items: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.$queryRaw<AppointmentRequestRow[]>`
        SELECT
          a.id,
          a.patient_id AS patientId,
          u.full_name AS patientName,
          u.phone AS patientPhone,
          u.email AS patientEmail,
          a.requested_date AS requestedDate,
          a.reason,
          a.status,
          a.scheduled_at AS scheduledAt,
          a.doctor_note AS doctorNote,
          a.created_at AS createdAt
        FROM appointments a
        INNER JOIN patients p ON p.id = a.patient_id
        INNER JOIN users u ON u.id = p.user_id
        WHERE a.doctor_id = ${doctor.id}
        ORDER BY a.created_at DESC
        LIMIT 20
      `,
    ]);

    res.json({
      totalPrescriptionsToday: todayCount,
      totalActivePatients: activePatients.length,
      pendingRefillAlerts: Number(pendingRefills[0]?.count || 0),
      pendingAppointmentRequests: appointmentRequests.filter((item) => item.status === "requested").length,
      appointmentRequests,
      recentPrescriptions,
    });
  }),
);

doctorRoutes.get(
  "/refill-requests",
  asyncHandler(async (req, res) => {
    const doctor = await getDoctor(req.user!.id);
    const requests = await prisma.$queryRaw<RefillRequestRow[]>`
      SELECT
        ra.id,
        ra.prescription_id AS prescriptionId,
        ra.patient_id AS patientId,
        u.full_name AS patientName,
        u.phone AS patientPhone,
        u.email AS patientEmail,
        ra.alert_date AS alertDate,
        ra.status,
        ra.doctor_note AS doctorNote,
        ra.responded_at AS respondedAt,
        p.disease,
        p.issued_date AS issuedDate,
        p.expiry_date AS expiryDate
      FROM refill_alerts ra
      INNER JOIN patients pt ON pt.id = ra.patient_id
      INNER JOIN users u ON u.id = pt.user_id
      INNER JOIN prescriptions p ON p.id = ra.prescription_id
      WHERE ra.doctor_id = ${doctor.id}
        AND ra.alert_type = 'refill_request'
      ORDER BY
        CASE ra.status WHEN 'requested' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
        ra.alert_date DESC
    `;

    const prescriptionIds = [...new Set(requests.map((item) => item.prescriptionId))];
    const items = prescriptionIds.length
      ? await prisma.prescriptionItem.findMany({
          where: { prescriptionId: { in: prescriptionIds } },
          orderBy: { medicineName: "asc" },
        })
      : [];

    res.json({
      refillRequests: requests.map((request) => ({
        ...request,
        items: items.filter((item) => item.prescriptionId === request.prescriptionId),
      })),
    });
  }),
);

doctorRoutes.patch(
  "/refill-requests/:id",
  asyncHandler(async (req, res) => {
    const doctor = await getDoctor(req.user!.id);
    const refillRequestId = String(req.params.id);
    const body = refillResponseSchema.parse(req.body);

    const existing = (
      await prisma.$queryRaw<RefillRequestRow[]>`
        SELECT
          ra.id,
          ra.prescription_id AS prescriptionId,
          ra.patient_id AS patientId,
          u.full_name AS patientName,
          u.phone AS patientPhone,
          u.email AS patientEmail,
          ra.alert_date AS alertDate,
          ra.status,
          ra.doctor_note AS doctorNote,
          ra.responded_at AS respondedAt,
          p.disease,
          p.issued_date AS issuedDate,
          p.expiry_date AS expiryDate
        FROM refill_alerts ra
        INNER JOIN patients pt ON pt.id = ra.patient_id
        INNER JOIN users u ON u.id = pt.user_id
        INNER JOIN prescriptions p ON p.id = ra.prescription_id
        WHERE ra.id = ${refillRequestId}
          AND ra.doctor_id = ${doctor.id}
          AND ra.alert_type = 'refill_request'
        LIMIT 1
      `
    )[0];

    if (!existing) throw new ApiError(404, "Refill request not found");
    if (existing.status !== "requested") throw new ApiError(409, "This refill request is already reviewed");

    const patient = await prisma.patient.findUnique({ where: { id: existing.patientId } });
    if (!patient) throw new ApiError(404, "Patient profile not found");

    const reviewedAt = new Date();
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.$executeRaw`
        UPDATE refill_alerts
        SET status = ${body.status},
            doctor_note = ${body.doctorNote || null},
            responded_at = ${reviewedAt},
            is_acknowledged = true,
            sent_at = ${reviewedAt},
            is_sent = true
        WHERE id = ${refillRequestId}
          AND doctor_id = ${doctor.id}
      `;

      await tx.notification.create({
        data: {
          userId: patient.userId,
          title: body.status === "approved" ? "Refill request approved" : "Refill request rejected",
          message:
            body.status === "approved"
              ? `Your refill request for ${existing.disease || "your prescription"} was approved.${body.doctorNote ? ` Note: ${body.doctorNote}` : ""}`
              : `Your refill request for ${existing.disease || "your prescription"} was rejected.${body.doctorNote ? ` Reason: ${body.doctorNote}` : ""}`,
          type: "refill",
        },
      });
    });

    await audit({
      userId: req.user!.id,
      action: body.status === "approved" ? "APPROVE_REFILL_REQUEST" : "REJECT_REFILL_REQUEST",
      entityType: "refill_alert",
      entityId: refillRequestId,
      ipAddress: req.ip,
    });

    res.json({
      refillRequest: {
        ...existing,
        status: body.status,
        doctorNote: body.doctorNote || null,
        respondedAt: reviewedAt,
      },
    });
  }),
);

doctorRoutes.post(
  "/appointments/:id/schedule",
  asyncHandler(async (req, res) => {
    const doctor = await getDoctor(req.user!.id);
    const appointmentId = String(req.params.id);
    const body = scheduleAppointmentSchema.parse(req.body);

    const existing = (
      await prisma.$queryRaw<AppointmentRequestRow[]>`
        SELECT
          a.id,
          a.patient_id AS patientId,
          u.full_name AS patientName,
          u.phone AS patientPhone,
          u.email AS patientEmail,
          a.requested_date AS requestedDate,
          a.reason,
          a.status,
          a.scheduled_at AS scheduledAt,
          a.doctor_note AS doctorNote,
          a.created_at AS createdAt
        FROM appointments a
        INNER JOIN patients p ON p.id = a.patient_id
        INNER JOIN users u ON u.id = p.user_id
        WHERE a.id = ${appointmentId} AND a.doctor_id = ${doctor.id}
        LIMIT 1
      `
    )[0];

    if (!existing) throw new ApiError(404, "Appointment request not found");

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE appointments
        SET status = 'scheduled',
            scheduled_at = ${body.scheduledAt},
            doctor_note = ${body.doctorNote || null}
        WHERE id = ${appointmentId} AND doctor_id = ${doctor.id}
      `;

      const patient = await tx.patient.findUnique({ where: { id: existing.patientId } });
      if (patient) {
        await tx.notification.create({
          data: {
            userId: patient.userId,
            title: "Appointment scheduled",
            message: `Your appointment is scheduled on ${body.scheduledAt.toLocaleString("en-IN")}.${body.doctorNote ? ` Note: ${body.doctorNote}` : ""}`,
            type: "system",
          },
        });
      }
    });

    const appointment = {
      ...existing,
      status: "scheduled",
      scheduledAt: body.scheduledAt,
      doctorNote: body.doctorNote || null,
    };

    res.json({ appointment });
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

    if (body.appointmentId) {
      const appointment = (
        await prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM appointments
          WHERE id = ${body.appointmentId}
            AND doctor_id = ${doctor.id}
            AND patient_id = ${patient.id}
          LIMIT 1
        `
      )[0];
      if (!appointment) throw new ApiError(404, "Appointment not found for this patient");
    }

    const expiryDate = body.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const { token, qrCode } = await createPrescriptionQr();

    const prescription = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.prescription.create({
        data: {
          doctorId: doctor.id,
          patientId: patient.id,
          qrCode,
          qrCodeToken: token,
          disease: body.disease,
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

      if (body.appointmentId) {
        await tx.$executeRaw`
          UPDATE appointments
          SET status = 'completed'
          WHERE id = ${body.appointmentId}
            AND doctor_id = ${doctor.id}
            AND patient_id = ${patient.id}
        `;
      }

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

doctorRoutes.patch(
  "/prescriptions/:id",
  asyncHandler(async (req, res) => {
    const doctor = await getDoctor(req.user!.id);
    const prescriptionId = String(req.params.id);
    const body = updatePrescriptionSchema.parse(req.body);
    const existing = await prisma.prescription.findFirst({
      where: { id: prescriptionId, doctorId: doctor.id },
      include: { items: true, dispensedRecord: true, patient: true },
    });

    if (!existing) throw new ApiError(404, "Prescription not found");
    if (existing.dispensedRecord || existing.status === "dispensed") {
      throw new ApiError(409, "Dispensed prescriptions cannot be edited");
    }

    const editDeadline = new Date(existing.createdAt.getTime() + PRESCRIPTION_EDIT_WINDOW_MINUTES * 60 * 1000);
    if (new Date() > editDeadline) {
      throw new ApiError(403, `Prescription can be edited only within ${PRESCRIPTION_EDIT_WINDOW_MINUTES} minutes of creation`);
    }

    const prescription = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.prescriptionItem.deleteMany({ where: { prescriptionId: existing.id } });
      const updated = await tx.prescription.update({
        where: { id: existing.id },
        data: {
          disease: body.disease,
          notes: body.notes,
          followUpDate: body.followUpDate,
          expiryDate: body.expiryDate || existing.expiryDate,
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
        },
        include: { items: true, patient: { include: { user: true } } },
      });

      await tx.notification.create({
        data: {
          userId: existing.patient.userId,
          title: "Prescription updated",
          message: "Your prescription was updated by the doctor.",
          type: "prescription",
        },
      });

      return updated;
    });

    await audit({
      userId: req.user!.id,
      action: "UPDATE_PRESCRIPTION",
      entityType: "prescription",
      entityId: prescription.id,
      ipAddress: req.ip,
    });

    res.json({ prescription, editWindowMinutes: PRESCRIPTION_EDIT_WINDOW_MINUTES });
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
