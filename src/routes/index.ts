import { Router } from "express";
import { adminRoutes } from "./admin.routes";
import { authRoutes } from "./auth.routes";
import { catalogRoutes } from "./catalog.routes";
import { doctorRoutes } from "./doctor.routes";
import { notificationsRoutes } from "./notifications.routes";
import { patientRoutes } from "./patient.routes";
import { pharmacyRoutes } from "./pharmacy.routes";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/catalog", catalogRoutes);
routes.use("/doctor", doctorRoutes);
routes.use("/patient", patientRoutes);
routes.use("/pharmacy", pharmacyRoutes);
routes.use("/admin", adminRoutes);
routes.use("/notifications", notificationsRoutes);
