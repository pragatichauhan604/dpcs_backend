import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@dpcs.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin1234";

  for (const [code, label] of [
    ["doctor", "Doctor"],
    ["patient", "Patient"],
    ["pharmacist", "Pharmacist"],
    ["admin", "Admin"],
  ]) {
    await prisma.userRole.upsert({ where: { code }, update: { label }, create: { code, label } });
  }

  for (const [code, label] of [
    ["male", "Male"],
    ["female", "Female"],
    ["other", "Other"],
  ]) {
    await prisma.gender.upsert({ where: { code }, update: { label }, create: { code, label } });
  }

  for (const [code, label] of [
    ["active", "Active"],
    ["dispensed", "Dispensed"],
    ["expired", "Expired"],
    ["cancelled", "Cancelled"],
  ]) {
    await prisma.prescriptionStatus.upsert({ where: { code }, update: { label }, create: { code, label } });
  }

  for (const [code, label] of [
    ["once_daily", "Once daily"],
    ["twice_daily", "Twice daily"],
    ["thrice_daily", "Three times daily"],
    ["as_needed", "As needed"],
  ]) {
    await prisma.medicineFrequency.upsert({ where: { code }, update: { label }, create: { code, label } });
  }

  for (const [code, label] of [
    ["before_food", "Before food"],
    ["after_food", "After food"],
    ["with_food", "With food"],
    ["bedtime", "Bedtime"],
  ]) {
    await prisma.medicineTiming.upsert({ where: { code }, update: { label }, create: { code, label } });
  }

  for (const [code, label] of [
    ["completed", "Completed"],
    ["partial", "Partial"],
    ["rejected", "Rejected"],
  ]) {
    await prisma.dispenseStatus.upsert({ where: { code }, update: { label }, create: { code, label } });
  }

  for (const [code, label] of [
    ["expiry_warning", "Expiry warning"],
    ["low_stock", "Low stock"],
    ["refill_request", "Refill request"],
  ]) {
    await prisma.alertType.upsert({ where: { code }, update: { label }, create: { code, label } });
  }

  for (const [code, label] of [
    ["prescription", "Prescription"],
    ["refill", "Refill"],
    ["dispense", "Dispense"],
    ["system", "System"],
  ]) {
    await prisma.notificationType.upsert({ where: { code }, update: { label }, create: { code, label } });
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      fullName: "DPCS Admin",
      email: adminEmail,
      phone: "9999999999",
      role: "admin",
      isActive: true,
      isVerified: true,
      passwordHash: await bcrypt.hash(adminPassword, 12),
    },
  });

  const medicines = [
    {
      brandName: "Dolo 650",
      genericName: "Paracetamol",
      category: "Painkiller",
      manufacturer: "Micro Labs",
      dosageForms: "Tablet",
      standardStrength: "650mg",
    },
    {
      brandName: "Crocin",
      genericName: "Paracetamol",
      category: "Painkiller",
      manufacturer: "GSK",
      dosageForms: "Tablet",
      standardStrength: "500mg",
    },
    {
      brandName: "Augmentin",
      genericName: "Amoxicillin + Clavulanic Acid",
      category: "Antibiotic",
      manufacturer: "GSK",
      dosageForms: "Tablet",
      standardStrength: "625mg",
    },
  ];

  for (const medicine of medicines) {
    const existing = await prisma.medicine.findFirst({
      where: { brandName: medicine.brandName, standardStrength: medicine.standardStrength },
    });

    if (!existing) {
      await prisma.medicine.create({ data: medicine });
    }
  }

  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
