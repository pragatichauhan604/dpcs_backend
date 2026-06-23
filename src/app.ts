import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { routes } from "./routes";
import { errorHandler, notFound } from "./middleware/error";

dotenv.config();

export const app = express();
const allowedOrigins = new Set([
  ...(process.env.CLIENT_URL?.split(",").map((origin) => origin.trim()).filter(Boolean) || []),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "dpcs-backend" });
});

app.get("/api/docs.json", (_req, res) => {
  res.json(swaggerSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);
