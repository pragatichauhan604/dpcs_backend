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

  for (const [code, label] of [
    ["requested", "Requested"],
    ["scheduled", "Scheduled"],
    ["cancelled", "Cancelled"],
    ["completed", "Completed"],
  ]) {
    await prisma.$executeRaw`
      INSERT INTO appointment_statuses (code, label)
      VALUES (${code}, ${label})
      ON DUPLICATE KEY UPDATE label = VALUES(label)
    `;
  }

  for (const [code, label] of [
    ["requested", "Requested"],
    ["approved", "Approved"],
    ["rejected", "Rejected"],
  ]) {
    await prisma.$executeRaw`
      INSERT INTO refill_request_statuses (code, label)
      VALUES (${code}, ${label})
      ON DUPLICATE KEY UPDATE label = VALUES(label)
    `;
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

  await prisma.pharmacy.upsert({
    where: { id: "550e8400-e29b-41d4-a716-446655440005" },
    update: {
      isApproved: true,
      isActive: true,
    },
    create: {
      id: "550e8400-e29b-41d4-a716-446655440005",
      name: "DPCS Test Pharmacy",
      ownerName: "Pragati Chauhan",
      licenseNumber: "TEST-PHARMACY-001",
      address: "Main Road, Sector 12",
      city: "Noida",
      pincode: "201301",
      latitude: 28.5355,
      longitude: 77.3910,
      phone: "9876543210",
      email: "testpharmacy@dpcs.local",
      isApproved: true,
      isActive: true,
    },
  });

  const testPharmacyId = "550e8400-e29b-41d4-a716-446655440005";
  const inventoryMedicines = await prisma.medicine.findMany({
    where: { brandName: { in: ["Dolo 650", "Crocin", "Augmentin"] } },
  });

  for (const [index, medicine] of inventoryMedicines.entries()) {
    const existing = await prisma.pharmacyInventory.findFirst({
      where: { pharmacyId: testPharmacyId, medicineId: medicine.id, batchNumber: `TEST-BATCH-${index + 1}` },
    });

    const data = {
      pharmacyId: testPharmacyId,
      medicineId: medicine.id,
      medicineName: medicine.brandName,
      quantity: 40 - index * 5,
      batchNumber: `TEST-BATCH-${index + 1}`,
      unitPrice: 25 + index * 8,
      reorderLevel: 10,
    };

    if (existing) {
      await prisma.pharmacyInventory.update({ where: { id: existing.id }, data });
    } else {
      await prisma.pharmacyInventory.create({ data });
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
