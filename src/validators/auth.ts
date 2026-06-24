import { z } from "zod";
import { allowedString, passwordSchema, phoneSchema } from "./common";

export const roles = ["doctor", "patient", "pharmacist", "admin"] as const;
export const genders = ["male", "female", "other"] as const;

const baseRegistration = {
  fullName: z.string().min(3).max(100),
  email: z.string().email().max(150),
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: phoneSchema,
};

const passwordMatch = <T extends z.ZodTypeAny>(schema: T) =>
  schema.refine((data) => (data as { password: string; confirmPassword: string }).password === (data as { password: string; confirmPassword: string }).confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const profilePhotoSchema = z
  .string()
  .max(2_800_000, "Profile photo must be 2 MB or smaller")
  .regex(/^data:image\/(png|jpe?g|webp);base64,/i, "Profile photo must be JPG, PNG, or WebP")
  .optional();

export const doctorRegistrationSchema = passwordMatch(
  z.object({
    ...baseRegistration,
    licenseNumber: z.string().min(3).max(50),
    specialization: z.string().min(2).max(100),
    hospitalName: z.string().min(3).max(150),
    hospitalAddress: z.string().min(5),
    city: z.string().min(2).max(80),
    pincode: z.string().regex(/^\d{6}$/),
    profilePhoto: profilePhotoSchema,
  }),
);

export const patientRegistrationSchema = passwordMatch(
  z.object({
    ...baseRegistration,
    dateOfBirth: z.coerce.date(),
    gender: allowedString(genders),
    bloodGroup: z.string().max(5).optional(),
    address: z.string().min(5),
    city: z.string().min(2).max(80),
    pincode: z.string().regex(/^\d{6}$/),
    aadharNumber: z.string().max(20).optional(),
    emergencyContact: phoneSchema.optional(),
  }),
);

export const pharmacistRegistrationSchema = passwordMatch(
  z.object({
    ...baseRegistration,
    pharmacyId: z.string().uuid(),
    licenseNumber: z.string().min(3).max(50),
  }),
);

export const adminRegistrationSchema = passwordMatch(
  z.object({
    ...baseRegistration,
  }),
);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: allowedString(roles).optional(),
  rememberMe: z.boolean().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = passwordMatch(
  z.object({
    email: z.string().email(),
    otp: z.string().regex(/^\d{6}$/),
    password: passwordSchema,
    confirmPassword: z.string(),
  }),
);
