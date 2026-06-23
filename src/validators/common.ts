import { z } from "zod";

export const idParam = z.object({
  id: z.string().uuid(),
});

export const paginationQuery = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, "Password must include one uppercase letter")
  .regex(/[0-9]/, "Password must include one number");

export const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Use a valid 10-digit Indian mobile number");

export const allowedString = <T extends readonly string[]>(values: T) =>
  z.string().refine((value) => values.includes(value), {
    message: `Allowed values: ${values.join(", ")}`,
  });
