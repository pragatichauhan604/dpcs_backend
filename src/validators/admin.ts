import { z } from "zod";

export const approvalSchema = z.object({
  isApproved: z.boolean(),
});

export const medicineSchema = z.object({
  brandName: z.string().min(2).max(150),
  genericName: z.string().min(2).max(150),
  category: z.string().min(2).max(100),
  manufacturer: z.string().max(150).optional(),
  dosageForms: z.string().min(2).max(100),
  standardStrength: z.string().max(100).optional(),
  requiresPrescription: z.boolean().default(true),
  description: z.string().max(3000).optional(),
  isActive: z.boolean().default(true),
});
