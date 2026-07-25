type PdfPrescription = {
  id: string;
  status: string;
  disease?: string | null;
  issuedDate: Date | string;
  expiryDate: Date | string;
  notes?: string | null;
  qrCodeToken?: string | null;
  doctor?: { specialization?: string | null; hospitalName?: string | null; user?: { fullName?: string | null; phone?: string | null } | null } | null;
  patient?: { bloodGroup?: string | null; city?: string | null; user?: { fullName?: string | null; phone?: string | null } | null } | null;
  items: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    timing?: string | null;
    instructions?: string | null;
  }>;
};

const escapePdf = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const formatDate = (value: Date | string) => new Date(value).toLocaleDateString("en-IN");

const clean = (value: unknown) =>
  String(value ?? "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const wrapLine = (text: string, max = 86) => {
  const words = clean(text).split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
};

export const createPrescriptionPdf = (prescription: PdfPrescription) => {
  const lines = [
    "Digital Prescription and Pharmacy Coordination System",
    `Prescription ID: ${prescription.id}`,
    `Status: ${prescription.status}`,
    `Disease / Diagnosis: ${prescription.disease || "General treatment"}`,
    `Issued: ${formatDate(prescription.issuedDate)}    Expires: ${formatDate(prescription.expiryDate)}`,
    "",
    `Doctor: ${prescription.doctor?.user?.fullName || "Doctor"}`,
    `Specialization: ${prescription.doctor?.specialization || "-"}`,
    `Hospital: ${prescription.doctor?.hospitalName || "-"}`,
    `Doctor Phone: ${prescription.doctor?.user?.phone || "-"}`,
    "",
    `Patient: ${prescription.patient?.user?.fullName || "Patient"}`,
    `Patient Phone: ${prescription.patient?.user?.phone || "-"}`,
    `Blood Group: ${prescription.patient?.bloodGroup || "-"}    City: ${prescription.patient?.city || "-"}`,
    "",
    "Medicines",
    "------------------------------------------------------------",
    ...prescription.items.flatMap((item, index) =>
      wrapLine(`${index + 1}. ${item.medicineName} | ${item.dosage} | ${item.frequency} | ${item.durationDays} days | ${item.timing || "-"}`).concat(
        item.instructions ? wrapLine(`   Instructions: ${item.instructions}`) : [],
      ),
    ),
    "",
    `Notes: ${prescription.notes || "-"}`,
    `QR Token: ${prescription.qrCodeToken || "-"}`,
  ];

  const contentLines: string[] = ["BT", "/F1 11 Tf", "50 790 Td", "14 TL"];
  lines.flatMap((line) => wrapLine(line)).forEach((line, index) => {
    contentLines.push(`${index === 0 ? "" : "T*"}(${escapePdf(line)}) Tj`);
  });
  contentLines.push("ET");
  const stream = contentLines.join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "binary");
};
