import { z } from "zod";
import { allowedString } from "./common";

export const frequencies = ["once_daily", "twice_daily", "thrice_daily", "as_needed"] as const;
export const timings = ["before_food", "after_food", "with_food", "bedtime"] as const;

export const prescriptionItemSchema = z.object({
  medicineId: z.string().uuid().optional(),
  medicineName: z.string().min(2).max(150),
  dosage: z.string().min(1).max(50),
  frequency: allowedString(frequencies),
  durationDays: z.number().int().min(1).max(365),
  timing: allowedString(timings).optional(),
  quantityToTake: z.string().max(50).optional(),
  instructions: z.string().max(1000).optional(),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  disease: z.string().min(2).max(150).optional(),
  notes: z.string().max(3000).optional(),
  followUpDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  items: z.array(prescriptionItemSchema).min(1),
});
