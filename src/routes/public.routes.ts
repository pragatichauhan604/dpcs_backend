import { Router } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../middleware/error";
import { asyncHandler } from "../utils/asyncHandler";
import { createPrescriptionPdf } from "../utils/prescriptionPdf";

export const publicRoutes = Router();

publicRoutes.get(
  "/prescriptions/qr/:token/pdf",
  asyncHandler(async (req, res) => {
    const token = String(req.params.token);
    const prescription = await prisma.prescription.findUnique({
      where: { qrCodeToken: token },
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
