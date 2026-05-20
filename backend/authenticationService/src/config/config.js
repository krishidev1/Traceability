import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

function asNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: asNumber(process.env.AUTH_PORT || process.env.PORT, 8002),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecretKey: process.env.JWT_SECRET_KEY || "change_me",
  jwtSecretKeyAlt: process.env.JWT_SECRET_KEY_ALT || "",
  jwtIssuer: process.env.JWT_ISSUER || "internlabs-auth-service",
  jwtAudience: process.env.JWT_AUDIENCE || "internlabs-api",
  jwtExpireMinutes: asNumber(process.env.JWT_EXPIRE_MINUTES, 120),
  refreshExpireDays: asNumber(process.env.REFRESH_EXPIRE_DAYS, 30),
  otpLength: asNumber(process.env.OTP_LENGTH, 6),
  otpExpiryMinutes: asNumber(process.env.OTP_EXPIRY_MINUTES, 10),
  otpMaxAttempts: asNumber(process.env.OTP_MAX_ATTEMPTS, 5),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000",
  azureMail: {
    tenantId: process.env.TENANT_ID || "",
    clientId: process.env.CLIENT_ID || "",
    clientSecret: process.env.CLIENT_SECRET || "",
    mailbox: process.env.MAILBOX || ""
  },
  googleOauth: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI || ""
  }
};

if (!config.databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}
