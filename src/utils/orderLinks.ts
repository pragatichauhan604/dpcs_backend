import { Prescription, PrescriptionItem } from "@prisma/client";

export const buildPartnerOrderUrl = (
  prescription: Prescription & { items: PrescriptionItem[] },
) => {
  const base = process.env.PARTNER_PHARMACY_BASE_URL || "";
  const params = new URLSearchParams({
    prescriptionId: prescription.id,
    medicines: prescription.items
      .map((item) => `${item.medicineName} ${item.dosage}`.trim())
      .join(", "),
  });

  return `${base}?${params.toString()}`;
};
