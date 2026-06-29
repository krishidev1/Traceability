import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/config.js";
import authRoutes from "./routes/authRoutes.js";
import { createLogger, logError, requestLogger } from "../../shared/nodeLogger.js";

const app = express();
const logger = createLogger("authenticationService");

app.use(helmet());
app.use(requestLogger("authenticationService"));

const allowedOrigins = String(config.corsOrigin || "")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.length) return callback(null, true);
      return callback(null, allowedOrigins.includes(origin));
    },
    credentials: true
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "authenticationService" });
});

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

app.use((err, req, res, _next) => {
  logError(logger, err, req);
  const statusCode = Number(err?.statusCode) || Number(err?.status) || 500;
  const detail = err?.detail || err?.message || "Internal server error.";
  res.status(statusCode).json({ detail, request_id: req.requestId });
});

export default app;
