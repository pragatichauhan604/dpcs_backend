import { Router } from "express";
import { hashPassword, signToken, verifyPassword } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { ApiError } from "../middleware/error";
import { asyncHandler } from "../utils/asyncHandler";
import {
  adminRegistrationSchema,
  doctorRegistrationSchema,
  forgotPasswordSchema,
  loginSchema,
  patientRegistrationSchema,
  pharmacistRegistrationSchema,
  resetPasswordSchema,
} from "../validators/auth";

export const authRoutes = Router();

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  isVerified: true,
  profilePhoto: true,
  doctor: true,
  patient: true,
  pharmacist: { include: { pharmacy: true } },
};

authRoutes.post(
  "/register/admin",
  asyncHandler(async (req, res) => {
    const body = adminRegistrationSchema.parse(req.body);
    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email.toLowerCase(),
        passwordHash,
        phone: body.phone,
        role: "admin",
        isActive: true,
        isVerified: true,
      },
      select: publicUserSelect,
    });

    res.status(201).json({ message: "Admin registered successfully.", user });
  }),
);

authRoutes.post(
  "/register/doctor",
  asyncHandler(async (req, res) => {
    const body = doctorRegistrationSchema.parse(req.body);
    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email.toLowerCase(),
        passwordHash,
        phone: body.phone,
        role: "doctor",
        profilePhoto: body.profilePhoto,
        doctor: {
          create: {
            licenseNumber: body.licenseNumber,
            specialization: body.specialization,
            hospitalName: body.hospitalName,
            hospitalAddress: body.hospitalAddress,
            city: body.city,
            pincode: body.pincode,
          },
        },
      },
      select: publicUserSelect,
    });

    res.status(201).json({ message: "Doctor registered. Admin approval required.", user });
  }),
);

authRoutes.post(
  "/register/patient",
  asyncHandler(async (req, res) => {
    const body = patientRegistrationSchema.parse(req.body);
    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email.toLowerCase(),
        passwordHash,
        phone: body.phone,
        role: "patient",
        isVerified: true,
        patient: {
          create: {
            dateOfBirth: body.dateOfBirth,
            gender: body.gender,
            bloodGroup: body.bloodGroup,
            address: body.address,
            city: body.city,
            pincode: body.pincode,
            aadharNumber: body.aadharNumber,
            emergencyContact: body.emergencyContact,
          },
        },
      },
      select: publicUserSelect,
    });

    res.status(201).json({ message: "Patient registered successfully.", user });
  }),
);

authRoutes.post(
  "/register/pharmacist",
  asyncHandler(async (req, res) => {
    const body = pharmacistRegistrationSchema.parse(req.body);
    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email.toLowerCase(),
        passwordHash,
        phone: body.phone,
        role: "pharmacist",
        pharmacist: {
          create: {
            pharmacyId: body.pharmacyId,
            licenseNumber: body.licenseNumber,
          },
        },
      },
      select: publicUserSelect,
    });

    res.status(201).json({ message: "Pharmacist registered. Admin approval required.", user });
  }),
);

authRoutes.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: { doctor: true, patient: true, pharmacist: { include: { pharmacy: true } } },
    });

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (body.role && user.role !== body.role) {
      throw new ApiError(403, "Selected role does not match this account");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Account is inactive");
    }

    if (user.role === "doctor" && !user.doctor?.isApproved) {
      throw new ApiError(403, "Doctor account is pending admin approval");
    }

    if (user.role === "pharmacist" && !user.pharmacist?.isApproved) {
      throw new ApiError(403, "Pharmacist account is pending admin approval");
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    const token = signToken({ id: user.id, role: user.role, email: user.email }, body.rememberMe);
    const { passwordHash: _passwordHash, ...safeUser } = user;

    res.json({
      token,
      user: safeUser,
      redirectTo: `/${user.role === "pharmacist" ? "pharmacy" : user.role}/dashboard`,
    });
  }),
);

authRoutes.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const body = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });

    if (!user) {
      return res.json({ message: "If the email exists, an OTP has been sent." });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        otpHash: await hashPassword(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    res.json({
      message: "Password reset OTP generated.",
      devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
    });
  }),
);

authRoutes.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const body = resetPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user) throw new ApiError(400, "Invalid or expired OTP");

    const otpRecords = await prisma.passwordResetOtp.findMany({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const matchingOtp = (
      await Promise.all(
        otpRecords.map(async (record) => ({
          record,
          matches: await verifyPassword(body.otp, record.otpHash),
        })),
      )
    ).find((item) => item.matches)?.record;

    if (!matchingOtp) throw new ApiError(400, "Invalid or expired OTP");

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(body.password) },
      }),
      prisma.passwordResetOtp.update({
        where: { id: matchingOtp.id },
        data: { usedAt: new Date() },
      }),
    ]);

    res.json({ message: "Password reset successful." });
  }),
);

authRoutes.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: publicUserSelect,
    });

    res.json({ user });
  }),
);
