import { z } from "zod";
import { allowedString } from "./common";

export const dispenseStatuses = ["completed", "partial", "rejected"] as const;

export const createPharmacySchema = z.object({
  name: z.string().min(3).max(150),
  ownerName: z.string().min(3).max(100),
  licenseNumber: z.string().min(3).max(50),
  address: z.string().min(5),
  city: z.string().min(2).max(80),
  pincode: z.string().regex(/^\d{6}$/),
  latitude: z.number(),
  longitude: z.number(),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
});

export const inventoryUpsertSchema = z.object({
  medicineId: z.string().uuid(),
  quantity: z.number().int().min(0),
  batchNumber: z.string().max(50).optional(),
  unitPrice: z.number().nonnegative().optional(),
  expiryDate: z.coerce.date().optional(),
  reorderLevel: z.number().int().min(0).default(10),
});

export const dispenseSchema = z.object({
  status: allowedString(dispenseStatuses).default("completed"),
  notes: z.string().max(2000).optional(),
  partialReason: z.string().max(2000).optional(),
});
