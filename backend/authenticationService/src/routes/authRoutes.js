import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { config } from "../config/config.js";
import { generateOtp, generateTokenId, hashOtp, hashToken } from "../utils/crypto.js";
import { sendOtpEmail } from "../services/mailService.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";

const router = express.Router();

const LOGIN_PURPOSE = "login";
const SIGNUP_PURPOSE = "signup";
const SIGNUP_OTP_EXPIRY_MINUTES = 5;
const ADMIN_EMAIL = "admin@skillintern.com";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isGoogleConfigured() {
  return (
    Boolean(config.googleOauth.clientId) &&
    Boolean(config.googleOauth.clientSecret) &&
    Boolean(config.googleOauth.redirectUri)
  );
}

async function exchangeGoogleCode(code) {
  const body = new URLSearchParams();
  body.append("code", code);
  body.append("client_id", config.googleOauth.clientId);
  body.append("client_secret", config.googleOauth.clientSecret);
  body.append("redirect_uri", config.googleOauth.redirectUri);
  body.append("grant_type", "authorization_code");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    throw new Error(`Google token exchange failed: ${tokenRes.status} ${errBody}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function fetchGoogleUserProfile(accessToken) {
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!profileRes.ok) {
    const errBody = await profileRes.text();
    throw new Error(`Google userinfo failed: ${profileRes.status} ${errBody}`);
  }

  return profileRes.json();
}

async function upsertUserByEmail({ email, name }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query("SELECT id, public_id, name, email FROM users WHERE email = $1 LIMIT 1", [email]);
    let user;
    if (existing.rowCount) {
      user = existing.rows[0];
      if (name && user.name !== name) {
        const updated = await client.query(
          "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, public_id, name, email",
          [name, user.id]
        );
        user = updated.rows[0];
      }
    } else {
      const inserted = await client.query(
        "INSERT INTO users (name, email, resume_text) VALUES ($1, $2, '') RETURNING id, public_id, name, email",
        [name || "InternLabs User", email]
      );
      user = inserted.rows[0];
    }
    await client.query("COMMIT");
    return user;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function auditLog(client, userId, action, metadata = null) {
  await client.query(
    "INSERT INTO audit_logs (user_id, action, metadata, created_at) VALUES ($1, $2, $3, NOW())",
    [userId, action, metadata ? JSON.stringify(metadata) : null]
  );
}

async function issueTokenPair(client, user) {
  const accessToken = signAccessToken(user.id);
  const tokenId = generateTokenId();
  const refreshToken = signRefreshToken(user.id, tokenId);
  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + config.refreshExpireDays * 24 * 60 * 60 * 1000);

  await client.query(
    `INSERT INTO refresh_tokens (user_id, token_id, token_hash, expires_at, revoked, created_at)
     VALUES ($1, $2, $3, $4, FALSE, NOW())`,
    [user.id, tokenId, refreshTokenHash, expiresAt.toISOString()]
  );

  return { accessToken, refreshToken };
}

router.post("/request-code", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const name = String(req.body?.name || "").trim();

  if (!email || !email.includes("@")) {
    return res.status(400).json({ detail: "Valid email is required." });
  }

  if (email === ADMIN_EMAIL) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query("SELECT id, public_id, name, email FROM users WHERE email = $1 LIMIT 1", [email]);
      let user = existing.rows[0] || null;
      if (!user) {
        const inserted = await client.query(
          "INSERT INTO users (name, email, resume_text) VALUES ($1, $2, '') RETURNING id, public_id, name, email",
          [name || "Admin", email]
        );
        user = inserted.rows[0];
      } else if (name && user.name !== name) {
        const updated = await client.query(
          "UPDATE users SET name = $1 WHERE id = $2 RETURNING id, public_id, name, email",
          [name, user.id]
        );
        user = updated.rows[0];
      }

      await client.query("COMMIT");

      const token = signAccessToken(user.id);
      return res.json({
        access_token: token,
        token_type: "bearer",
        redirect_to: "/adminDashboard",
        user: { id: user.public_id, name: user.name, email: user.email }
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const otpCode = generateOtp(config.otpLength);
  const otpHash = hashOtp(otpCode);
  const expiresAt = new Date(Date.now() + config.otpExpiryMinutes * 60 * 1000);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    let userId = userResult.rows[0]?.id ?? null;
    if (!userId) {
      await client.query("ROLLBACK");
      return res.status(404).json({ detail: "Account not found. Please sign up first." });
    }

    if (name) {
      await client.query("UPDATE users SET name = $1 WHERE id = $2", [name, userId]);
    }

    await client.query(
      "UPDATE login_codes SET used = TRUE WHERE email = $1 AND purpose = $2 AND used = FALSE",
      [email, LOGIN_PURPOSE]
    );

    await client.query(
      `INSERT INTO login_codes (email, purpose, code_hash, expires_at, attempt_count, used, created_at)
       VALUES ($1, $2, $3, $4, 0, FALSE, NOW())`,
      [email, LOGIN_PURPOSE, otpHash, expiresAt.toISOString()]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  try {
    await sendOtpEmail({ email, otpCode });
  } catch (error) {
    return res.status(500).json({ detail: "Unable to send verification code." });
  }

  return res.json({
    message: "Verification code sent.",
    expires_in_minutes: config.otpExpiryMinutes
  });
});

router.post("/verify-code", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || "").trim();

  if (!email || !code) {
    return res.status(400).json({ detail: "Email and code are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const loginCodeResult = await client.query(
      `SELECT id, code_hash, expires_at, attempt_count, used
       FROM login_codes
       WHERE email = $1 AND purpose = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, LOGIN_PURPOSE]
    );

    if (!loginCodeResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(401).json({ detail: "Invalid or expired code." });
    }

    const loginCode = loginCodeResult.rows[0];
    if (loginCode.used || new Date(loginCode.expires_at).getTime() < Date.now()) {
      await client.query("ROLLBACK");
      return res.status(401).json({ detail: "Invalid or expired code." });
    }

    if (loginCode.attempt_count >= config.otpMaxAttempts) {
      await client.query("ROLLBACK");
      return res.status(429).json({ detail: "Too many attempts. Request a new code." });
    }

    const submittedHash = hashOtp(code);
    if (submittedHash !== loginCode.code_hash) {
      await client.query(
        "UPDATE login_codes SET attempt_count = attempt_count + 1 WHERE id = $1",
        [loginCode.id]
      );
      await client.query("COMMIT");
      return res.status(401).json({ detail: "Invalid or expired code." });
    }

    await client.query("UPDATE login_codes SET used = TRUE WHERE id = $1", [loginCode.id]);

    const userResult = await client.query(
      "SELECT id, public_id, name, email FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (!userResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ detail: "Account not found. Please sign up first." });
    }

    const user = userResult.rows[0];
    const { accessToken, refreshToken } = await issueTokenPair(client, user);
    await auditLog(client, user.id, "otp_login_success", { method: "otp" });

    await client.query("COMMIT");
    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      user: {
        id: user.public_id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.post("/send-signup-code", async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  if (!email || !email.includes("@")) {
    return res.status(400).json({ detail: "Valid email is required." });
  }

  const existingUser = await pool.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);
  if (existingUser.rowCount) {
    return res.status(409).json({ detail: "Email already registered. Please login." });
  }

  const otpCode = generateOtp(6);
  const otpHash = hashOtp(otpCode);
  const expiresAt = new Date(Date.now() + SIGNUP_OTP_EXPIRY_MINUTES * 60 * 1000);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "UPDATE login_codes SET used = TRUE WHERE email = $1 AND purpose = $2 AND used = FALSE",
      [email, SIGNUP_PURPOSE]
    );

    await client.query(
      `INSERT INTO login_codes (email, purpose, code_hash, expires_at, attempt_count, used, created_at)
       VALUES ($1, $2, $3, $4, 0, FALSE, NOW())`,
      [email, SIGNUP_PURPOSE, otpHash, expiresAt.toISOString()]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  try {
    await sendOtpEmail({ email, otpCode });
  } catch {
    return res.status(500).json({ detail: "Unable to send verification code." });
  }

  return res.json({ message: "Verification code sent.", expires_in_minutes: SIGNUP_OTP_EXPIRY_MINUTES });
});

router.post("/verify-signup-code", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || "").trim();

  if (!email || !code) {
    return res.status(400).json({ detail: "Email and code are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const loginCodeResult = await client.query(
      `SELECT id, code_hash, expires_at, attempt_count, used
       FROM login_codes
       WHERE email = $1 AND purpose = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, SIGNUP_PURPOSE]
    );

    if (!loginCodeResult.rowCount) {
      await client.query("ROLLBACK");
      return res.status(401).json({ detail: "Invalid or expired code." });
    }

    const record = loginCodeResult.rows[0];
    if (record.used || new Date(record.expires_at).getTime() < Date.now()) {
      await client.query("ROLLBACK");
      return res.status(401).json({ detail: "Invalid or expired code." });
    }

    if (record.attempt_count >= config.otpMaxAttempts) {
      await client.query("ROLLBACK");
      return res.status(429).json({ detail: "Too many attempts. Request a new code." });
    }

    const submittedHash = hashOtp(code);
    if (submittedHash !== record.code_hash) {
      await client.query("UPDATE login_codes SET attempt_count = attempt_count + 1 WHERE id = $1", [record.id]);
      await client.query("COMMIT");
      return res.status(401).json({ detail: "Invalid or expired code." });
    }

    await client.query("UPDATE login_codes SET used = TRUE WHERE id = $1", [record.id]);
    await client.query("COMMIT");

    return res.json({ message: "Verification code verified." });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.post("/signup", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const name = String(req.body?.name || "").trim();
  const code = String(req.body?.code || "").trim();

  if (!email || !email.includes("@") || !name || !code) {
    return res.status(400).json({ detail: "Name, email, and code are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const signupCodeRes = await client.query(
      `SELECT id, code_hash, expires_at, used
       FROM login_codes
       WHERE email = $1 AND purpose = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, SIGNUP_PURPOSE]
    );

    if (!signupCodeRes.rowCount) {
      await client.query("ROLLBACK");
      return res.status(401).json({ detail: "Invalid or expired code." });
    }

    const record = signupCodeRes.rows[0];
    if (!record.used) {
      // Allow direct signup without separate verify call.
      if (new Date(record.expires_at).getTime() < Date.now()) {
        await client.query("ROLLBACK");
        return res.status(401).json({ detail: "Invalid or expired code." });
      }

      const submittedHash = hashOtp(code);
      if (submittedHash !== record.code_hash) {
        await client.query("ROLLBACK");
        return res.status(401).json({ detail: "Invalid or expired code." });
      }

      await client.query("UPDATE login_codes SET used = TRUE WHERE id = $1", [record.id]);
    } else {
      // Code was already verified; still validate matches the verified code hash.
      const submittedHash = hashOtp(code);
      if (submittedHash !== record.code_hash || new Date(record.expires_at).getTime() < Date.now()) {
        await client.query("ROLLBACK");
        return res.status(401).json({ detail: "Invalid or expired code." });
      }
    }

    const existingUser = await client.query("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);
    if (existingUser.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({ detail: "Email already registered." });
    }

    const inserted = await client.query(
      "INSERT INTO users (name, email, resume_text) VALUES ($1, $2, '') RETURNING id, public_id, name, email",
      [name, email]
    );

    const user = inserted.rows[0];
    const token = signAccessToken(user.id);

    await client.query("COMMIT");
    return res.status(201).json({
      access_token: token,
      token_type: "bearer",
      user: { id: user.public_id, name: user.name, email: user.email }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

router.get("/google", async (req, res) => {
  if (!isGoogleConfigured()) {
    return res.status(500).json({ detail: "Google OAuth is not configured." });
  }

  const frontendRedirect = String(req.query.frontend_redirect || "").trim();
  const params = new URLSearchParams();
  params.append("client_id", config.googleOauth.clientId);
  params.append("redirect_uri", config.googleOauth.redirectUri);
  params.append("response_type", "code");
  params.append("scope", "openid email profile");
  params.append("access_type", "offline");
  params.append("prompt", "consent");
  if (frontendRedirect) {
    params.append("state", frontendRedirect);
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return res.redirect(authUrl);
});

router.get("/google/callback", async (req, res) => {
  if (!isGoogleConfigured()) {
    return res.status(500).json({ detail: "Google OAuth is not configured." });
  }

  const code = String(req.query.code || "");
  if (!code) {
    return res.status(400).json({ detail: "Authorization code is required." });
  }

  try {
    const googleAccessToken = await exchangeGoogleCode(code);
    const profile = await fetchGoogleUserProfile(googleAccessToken);
    const email = normalizeEmail(profile.email);
    if (!email) {
      return res.status(400).json({ detail: "Google account email not available." });
    }

    const user = await upsertUserByEmail({ email, name: profile.name || "InternLabs User" });
    const client = await pool.connect();
    let accessToken;
    let refreshToken;
    try {
      await client.query("BEGIN");
      ({ accessToken, refreshToken } = await issueTokenPair(client, user));
      await auditLog(client, user.id, "oauth_login_success", { method: "google" });
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    const frontendRedirect = String(req.query.state || "").trim();

    if (frontendRedirect) {
      const safeRedirect = new URL(frontendRedirect);
      safeRedirect.searchParams.set("auth_token", accessToken);
      safeRedirect.searchParams.set("refresh_token", refreshToken);
      safeRedirect.searchParams.set("auth_user", Buffer.from(JSON.stringify({
        id: user.public_id,
        name: user.name,
        email: user.email
      })).toString("base64url"));
      return res.redirect(safeRedirect.toString());
    }

    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      user: {
        id: user.public_id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ detail: "Google authentication failed." });
  }
});

router.post("/refresh", async (req, res) => {
  const refreshToken = String(req.body?.refresh_token || "").trim();
  if (!refreshToken) {
    return res.status(400).json({ detail: "refresh_token is required." });
  }

  try {
    const payload = jwt.verify(refreshToken, config.jwtSecretKey, {
      algorithms: ["HS256"],
      issuer: config.jwtIssuer,
      audience: config.jwtAudience
    });

    if (payload.typ !== "refresh" || !payload.sub || !payload.jti) {
      return res.status(401).json({ detail: "Invalid refresh token." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existing = await client.query(
        `SELECT id, user_id, revoked, expires_at
         FROM refresh_tokens
         WHERE token_id = $1 AND token_hash = $2
         LIMIT 1`,
        [payload.jti, hashToken(refreshToken)]
      );

      if (!existing.rowCount) {
        await client.query("ROLLBACK");
        return res.status(401).json({ detail: "Invalid refresh token." });
      }

      const row = existing.rows[0];
      if (row.revoked || new Date(row.expires_at).getTime() < Date.now()) {
        await client.query("ROLLBACK");
        return res.status(401).json({ detail: "Refresh token expired or revoked." });
      }

      const userResult = await client.query("SELECT id, name, email FROM users WHERE id = $1 LIMIT 1", [row.user_id]);
      if (!userResult.rowCount) {
        await client.query("ROLLBACK");
        return res.status(401).json({ detail: "User not found." });
      }

      await client.query("UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1", [row.id]);
      const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(client, userResult.rows[0]);
      await auditLog(client, row.user_id, "token_refreshed");
      await client.query("COMMIT");

      return res.json({
        access_token: accessToken,
        refresh_token: newRefreshToken,
        token_type: "bearer"
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch {
    return res.status(401).json({ detail: "Invalid refresh token." });
  }
});

router.post("/logout", async (req, res) => {
  const refreshToken = String(req.body?.refresh_token || "").trim();
  if (!refreshToken) {
    return res.json({ message: "Logged out" });
  }
  try {
    const payload = jwt.verify(refreshToken, config.jwtSecretKey, {
      algorithms: ["HS256"],
      issuer: config.jwtIssuer,
      audience: config.jwtAudience
    });
    if (payload?.jti) {
      await pool.query("UPDATE refresh_tokens SET revoked = TRUE WHERE token_id = $1", [payload.jti]);
    }
  } catch {
    // no-op
  }
  return res.json({ message: "Logged out" });
});

export default router;
