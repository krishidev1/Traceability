const express = require('express');
const crypto = require('crypto');

const jwt = require('jsonwebtoken');

const db = require('../config/db');

const router = express.Router();
let schemaReadyPromise = null;

const ACCOUNT_TYPE_ALIASES = new Map([
  ['grower', 'grower'],
  ['shrimp_farmer', 'grower'],
  ['beekeeper', 'grower'],
  ['government_organization', 'grower'],
  ['farmer', 'grower'],
  ['supplier', 'supplier'],
  ['exporter', 'supplier'],
  ['retailer', 'supplier'],
]);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone || '').replace(/[^\d+]/g, '').trim();
}

function isKnownKancheepuramOrganisation(name) {
  const value = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return value.includes('kancheepuram') && value.includes('silk');
}

function validPhone(phone) {
  return /^\+?[1-9]\d{9,14}$/.test(phone);
}

function passwordIsStrong(password) {
  return password.length >= 8
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

function validDataUrl(value, mimeType, signature) {
  const match = String(value || '').match(/^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+=*)$/i);
  if (!match || match[1].toLowerCase() !== mimeType) return false;
  const file = Buffer.from(match[2], 'base64');
  return file.length > 0
    && file.length <= 5 * 1024 * 1024
    && file.subarray(0, signature.length).equals(signature);
}

function validCompanyLogo(value) {
  const match = String(value || '').match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+=*)$/i);
  if (!match) return false;
  const file = Buffer.from(match[2], 'base64');
  if (!file.length || file.length > 5 * 1024 * 1024) return false;
  const mimeType = match[1].toLowerCase();
  if (mimeType === 'image/png') {
    return file.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === 'image/jpeg') {
    return file.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }
  return file.subarray(0, 4).toString() === 'RIFF'
    && file.subarray(8, 12).toString() === 'WEBP';
}

function encryptAadhaar(aadhaarNumber) {
  const encryptionSecret = process.env.AADHAAR_ENCRYPTION_KEY;
  if (!encryptionSecret) {
    const error = new Error('Aadhaar encryption is not configured. Leave Aadhaar blank or contact support.');
    error.status = 503;
    throw error;
  }

  const key = crypto.createHash('sha256').update(encryptionSecret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(aadhaarNumber, 'utf8'), cipher.final()]);
  return `v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}`;
}

function signedVerificationToken(claims) {
  return jwt.sign(claims, jwtSecret(), { expiresIn: '15m' });
}

function isValidVerificationToken(token, purpose, value) {
  try {
    const claims = jwt.verify(String(token || ''), jwtSecret());
    return claims.purpose === purpose && claims.value === value;
  } catch {
    return false;
  }
}

function msg91Mobile(phone) {
  const countryCode = String(process.env.MSG91_COUNTRY_CODE || '91').replace(/\D/g, '');
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `${countryCode}${digits}` : digits;
}

function optionalNumber(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'admin' || value === 'administrator') return 'admin';
  return ACCOUNT_TYPE_ALIASES.get(value) || 'grower';
}

function appRole(role) {
  if (role === 'admin') return 'admin';
  return role === 'supplier' ? 'supplier' : 'grower';
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = crypto.pbkdf2Sync(String(password), salt, 120000, 64, 'sha512').toString('hex');
  return `pbkdf2_sha512$120000$${salt}$${key}`;
}

function verifyPassword(password, storedHash) {
  const [algorithm, iterations, salt, key] = String(storedHash || '').split('$');
  if (algorithm !== 'pbkdf2_sha512' || !iterations || !salt || !key) return false;
  const candidate = crypto.pbkdf2Sync(String(password), salt, Number(iterations), 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(key, 'hex'));
}

function jwtSecret() {
  return process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'change_me';
}

function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, jwtSecret(), {
    algorithm: 'HS256',
    expiresIn: `${Number(process.env.JWT_EXPIRE_MINUTES || 120)}m`,
    issuer: process.env.JWT_ISSUER || 'internlabs-auth-service',
    audience: process.env.JWT_AUDIENCE || 'internlabs-api',
  });
}

async function ensureAuthSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await db.query(`
        ALTER TABLE public.users
          ADD COLUMN IF NOT EXISTS account_type character varying(50),
          ADD COLUMN IF NOT EXISTS organisation_name character varying(255),
          ADD COLUMN IF NOT EXISTS gi_registry_match boolean NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS profile_image text,
          ADD COLUMN IF NOT EXISTS company_logo text,
          ADD COLUMN IF NOT EXISTS video_url text,
          ADD COLUMN IF NOT EXISTS video_locked boolean DEFAULT false,
          ADD COLUMN IF NOT EXISTS village_area character varying(150),
          ADD COLUMN IF NOT EXISTS district character varying(100),
          ADD COLUMN IF NOT EXISTS state character varying(100),
          ADD COLUMN IF NOT EXISTS country character varying(100),
          ADD COLUMN IF NOT EXISTS pincode character varying(20),
          ADD COLUMN IF NOT EXISTS gps_coordinates character varying(100),
          ADD COLUMN IF NOT EXISTS latitude numeric,
          ADD COLUMN IF NOT EXISTS longitude numeric,
          ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
          ADD COLUMN IF NOT EXISTS verification_status character varying(30) DEFAULT 'pending',
          ADD COLUMN IF NOT EXISTS aadhaar_number_encrypted text,
          ADD COLUMN IF NOT EXISTS mobile_verified boolean NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS gstin character varying(15),
          ADD COLUMN IF NOT EXISTS gst_registered_phone character varying(30),
          ADD COLUMN IF NOT EXISTS gst_mobile_verified boolean NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS gi_registry_document text,
          ADD COLUMN IF NOT EXISTS gi_registry_document_name character varying(255),
          ADD COLUMN IF NOT EXISTS profile_location text,
          ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS users_mob_idx
          ON public.users (mob)
          WHERE mob IS NOT NULL AND mob <> '';
      `);

      await db.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS users_gstin_unique_idx
          ON public.users (gstin)
          WHERE gstin IS NOT NULL AND gstin <> '';
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS public.password_reset_requests
        (
          id serial NOT NULL,
          identifier character varying(150) NOT NULL,
          requested_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          handled boolean DEFAULT false,
          CONSTRAINT password_reset_requests_pkey PRIMARY KEY (id)
        );
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS public.login_activity_logs
        (
          id serial NOT NULL,
          user_id integer,
          identifier character varying(150),
          success boolean NOT NULL DEFAULT false,
          ip_address text,
          user_agent text,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT login_activity_logs_pkey PRIMARY KEY (id)
        );
      `);
    })().catch((error) => {
      schemaReadyPromise = null;
      throw error;
    });
  }

  return schemaReadyPromise;
}

function userSelectSql(whereClause) {
  return `
    SELECT
      user_id,
      user_id::text AS public_id,
      full_name AS name,
      email,
      mob AS phone,
      password_hash,
      COALESCE(role, account_type, 'grower') AS       role,
      account_type,
      profile_image,
      company_logo,
      profile_location,
      mobile_verified,
      email_verified,
      gst_mobile_verified,
      video_url,
      village_area,
      district,
      state,
      country,
      pincode,
      gps_coordinates,
      is_verified,
      verification_status
    FROM users
    ${whereClause}
    LIMIT 1
  `;
}

async function getUserByIdentifier(identifier) {
  await ensureAuthSchema();
  const normalizedEmail = normalizeEmail(identifier);
  const normalizedPhone = normalizePhone(identifier);
  const result = await db.query(
    userSelectSql('WHERE LOWER(email) = $1 OR mob = $2'),
    [normalizedEmail, normalizedPhone],
  );
  return result.rows[0] || null;
}

async function insertUser(data) {
  await ensureAuthSchema();
  const accountType = normalizeRole(data.account_type);
  const role = 'farmer';
  const result = await db.query(
    `
    INSERT INTO users (
      account_type,
      organisation_name,
      gi_registry_match,
      role,
      full_name,
      mob,
      email,
      password_hash,
      profile_image,
      company_logo,
      profile_location,
      aadhaar_number_encrypted,
      mobile_verified,
      email_verified,
      gstin,
      gst_registered_phone,
      gst_mobile_verified,
      gi_registry_document,
      gi_registry_document_name,
      video_url,
      village_area,
      district,
      state,
      country,
      pincode,
      gps_coordinates,
      latitude,
      longitude,
      is_verified,
      verification_status
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, TRUE, TRUE,
      $13, $14, TRUE, $15, $16, NULL,
      $17, $18, $19, $20, $21, $22, $23, $24,
      FALSE, 'pending'
    )
    RETURNING
      user_id,
      user_id::text AS public_id,
      full_name AS name,
      email,
      mob AS phone,
      role,
      account_type,
      profile_image,
      company_logo,
      profile_location,
      mobile_verified,
      email_verified,
      gstin,
      gst_registered_phone,
      gst_mobile_verified,
      video_url,
      village_area,
      district,
      state,
      country,
      pincode,
      gps_coordinates,
      is_verified,
      verification_status
    `,
    [
      accountType,
      data.organisation_name || null,
      Boolean(data.gi_registry_match),
      role,
      data.full_name,
      data.phone,
      data.email,
      hashPassword(data.password),
      data.profile_image || null,
      data.company_logo || null,
      data.profile_location || null,
      data.aadhaar_number_encrypted || null,
      data.gstin,
      data.gst_registered_phone,
      data.gi_registry_document,
      data.gi_registry_document_name,
      data.village_area,
      data.district,
      data.state,
      data.country,
      data.pincode,
      data.gps_coordinates || null,
      optionalNumber(data.latitude),
      optionalNumber(data.longitude),
    ],
  );

  const user = result.rows[0];
  try {
    await db.query(
      `
      INSERT INTO user_roles (user_id, role)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [user.user_id, role],
    );
  } catch {
    // Auth still works if the optional user_roles table is not present.
  }
  return user;
}

function authResponse(user) {
  const rawRole = normalizeRole(user.account_type || user.role);
  return {
    access_token: signAccessToken(user.user_id),
    token_type: 'bearer',
    user: {
      id: user.public_id || String(user.user_id),
      user_id: Number(user.user_id),
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: appRole(rawRole),
      rawRole,
      account_type: user.account_type || rawRole,
      profile_image: user.profile_image || '',
      company_logo: user.company_logo || '',
      profile_location: user.profile_location || '',
      video_url: user.video_url || '',
      video_locked: Boolean(user.video_locked),
      village_area: user.village_area || '',
      district: user.district || '',
      state: user.state || '',
      country: user.country || '',
      pincode: user.pincode || '',
      gps_coordinates: user.gps_coordinates || '',
      is_verified: Boolean(user.is_verified),
      mobile_verified: Boolean(user.mobile_verified),
      email_verified: Boolean(user.email_verified),
      gst_mobile_verified: Boolean(user.gst_mobile_verified),
      verification_status: user.verification_status || 'pending',
    },
  };
}

router.post('/login', async (req, res, next) => {
  try {
    const identifier = String(req.body?.identifier || req.body?.email || req.body?.phone || '').trim();
    const password = String(req.body?.password || '');

    if (!identifier || !password) {
      return res.status(400).json({ detail: 'Email/mobile and password are required.' });
    }

    const user = await getUserByIdentifier(identifier);
    if (!user || !verifyPassword(password, user.password_hash)) {
      try {
        await db.query(
          'INSERT INTO login_activity_logs (identifier, success, ip_address, user_agent) VALUES ($1, FALSE, $2, $3)',
          [identifier, req.ip, req.headers['user-agent'] || ''],
        );
      } catch {
        // Optional audit table.
      }
      return res.status(401).json({ detail: 'Invalid email/mobile or password.' });
    }

    try {
      await db.query(
        'INSERT INTO login_activity_logs (user_id, identifier, success, ip_address, user_agent) VALUES ($1, $2, TRUE, $3, $4)',
        [user.user_id, identifier, req.ip, req.headers['user-agent'] || ''],
      );
    } catch {
      // Optional audit table.
    }

    return res.json(authResponse(user));
  } catch (error) {
    return next(error);
  }
});

function emailOtpServiceUrl() {
  return String(process.env.AUTH_EMAIL_OTP_SERVICE_URL || (
    process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8002'
  )).replace(/\/+$/, '');
}

async function requestEmailOtpService(path, payload) {
  const serviceUrl = emailOtpServiceUrl();
  if (!serviceUrl) {
    const error = new Error('Email OTP service is not configured.');
    error.status = 503;
    throw error;
  }

  let response;
  try {
    response = await fetch(`${serviceUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    const error = new Error('Email OTP service is unavailable.');
    error.status = 502;
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

router.post('/signup/send-email-otp', async (req, res) => {
  return res.status(410).json({ detail: 'Email OTP is temporarily disabled.' });
  /* OTP sending is intentionally disabled until explicitly re-enabled.
  const email = normalizeEmail(req.body?.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ detail: 'Enter a valid email address.' });
  }

  try {
    const { response, data } = await requestEmailOtpService(
      '/api/auth/send-signup-code',
      { email, applicationName: 'TraceConnect' },
    );
    if (!response.ok) {
      return res.status(response.status < 500 ? response.status : 502).json({
        detail: data.detail || 'Unable to send email verification code.',
      });
    }
    return res.json({ message: 'Verification code sent to your email.' });
  } catch (error) {
    return res.status(error.status || 502).json({ detail: error.message });
  }
  */
});

router.post('/signup/verify-email-otp', async (req, res) => {
  return res.status(410).json({ detail: 'Email OTP is temporarily disabled.' });
  /* OTP verification is intentionally disabled until explicitly re-enabled.
  const email = normalizeEmail(req.body?.email);
  const code = String(req.body?.code || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{4,8}$/.test(code)) {
    return res.status(400).json({ detail: 'Enter a valid email address and verification code.' });
  }

  try {
    const { response, data } = await requestEmailOtpService(
      '/api/auth/verify-signup-code',
      { email, code },
    );
    if (!response.ok) {
      return res.status(response.status < 500 ? response.status : 502).json({
        detail: data.detail || 'Email verification failed.',
      });
    }
    return res.json({
      message: 'Email verified.',
      verification_token: signedVerificationToken({ purpose: 'signup-email', value: email }),
    });
  } catch (error) {
    return res.status(error.status || 502).json({ detail: error.message });
  }
  */
});

router.post('/signup/send-phone-otp', async (req, res) => {
  return res.status(410).json({ detail: 'SMS OTP is temporarily disabled.' });
  /* OTP sending is intentionally disabled until explicitly re-enabled.
  const phone = normalizePhone(req.body?.phone);
  const purpose = String(req.body?.purpose || '');
  if (!validPhone(phone) || !['mobile', 'gst-mobile'].includes(purpose)) {
    return res.status(400).json({ detail: 'Enter a valid mobile number.' });
  }
  if (!process.env.MSG91_AUTH_KEY || !process.env.MSG91_TEMPLATE_ID) {
    return res.status(503).json({ detail: 'SMS OTP is not configured. Contact support to continue.' });
  }

  const url = new URL(process.env.MSG91_API_BASE_URL || 'https://control.msg91.com/api/v5/otp');
  url.searchParams.set('template_id', process.env.MSG91_TEMPLATE_ID);
  url.searchParams.set('mobile', msg91Mobile(phone));
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || String(data.type || '').toLowerCase() !== 'success') {
      return res.status(502).json({ detail: data.message || 'Unable to send SMS verification code.' });
    }
    return res.json({ message: 'Verification code sent by SMS.' });
  } catch {
    return res.status(502).json({ detail: 'SMS OTP service is unavailable.' });
  }
  */
});

router.post('/signup/verify-phone-otp', async (req, res) => {
  return res.status(410).json({ detail: 'SMS OTP is temporarily disabled.' });
  /* OTP verification is intentionally disabled until explicitly re-enabled.
  const phone = normalizePhone(req.body?.phone);
  const purpose = String(req.body?.purpose || '');
  const code = String(req.body?.code || '').trim();
  if (!validPhone(phone) || !['mobile', 'gst-mobile'].includes(purpose) || !/^\d{4,8}$/.test(code)) {
    return res.status(400).json({ detail: 'Enter a valid mobile number and verification code.' });
  }
  if (!process.env.MSG91_AUTH_KEY) {
    return res.status(503).json({ detail: 'SMS OTP is not configured. Contact support to continue.' });
  }

  const url = new URL(process.env.MSG91_API_BASE_URL || 'https://control.msg91.com/api/v5/otp');
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/verify`;
  url.searchParams.set('otp', code);
  url.searchParams.set('mobile', msg91Mobile(phone));
  try {
    const response = await fetch(url, {
      headers: { authkey: process.env.MSG91_AUTH_KEY },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || String(data.type || '').toLowerCase() !== 'success') {
      return res.status(401).json({ detail: data.message || 'Invalid or expired verification code.' });
    }
    const tokenPurpose = purpose === 'mobile' ? 'signup-mobile' : 'signup-gst-mobile';
    return res.json({
      message: 'Mobile number verified.',
      verification_token: signedVerificationToken({ purpose: tokenPurpose, value: phone }),
    });
  } catch {
    return res.status(502).json({ detail: 'SMS OTP service is unavailable.' });
  }
  */
});

router.post('/signup', async (req, res, next) => {
  try {
    const requestedAccountType = String(req.body?.account_type || '').trim().toLowerCase();
    if (requestedAccountType === 'admin' || requestedAccountType === 'administrator') {
      return res.status(403).json({ detail: 'Admin accounts can only be created by a database administrator.' });
    }
    const accountType = normalizeRole(req.body?.account_type);
    const fullName = String(req.body?.full_name || req.body?.name || '').trim();
    const profileType = String(req.body?.profile_type || 'individual').trim().toLowerCase();
    const organisationName = String(req.body?.organisation_name || '').trim().slice(0, 255);
    const phone = normalizePhone(req.body?.phone);
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirm_password || '');
    const profileImage = String(req.body?.profile_image || '').trim();
    const companyLogo = String(req.body?.company_logo || '').trim();
    const aadhaarNumber = String(req.body?.aadhaar_number || '').replace(/\D/g, '');
    const profileLocation = String(req.body?.profile_location || '').trim().slice(0, 1000);
    const villageArea = String(req.body?.location_area || '').trim().slice(0, 150);
    const district = String(req.body?.location_district || '').trim().slice(0, 100);
    const state = String(req.body?.location_state || '').trim().slice(0, 100);
    const country = String(req.body?.location_country || '').trim().slice(0, 100);
    const gstin = String(req.body?.gstin || '').trim().toUpperCase();
    const gstRegisteredPhone = normalizePhone(req.body?.gst_registered_phone);
    const giRegistryDocument = String(req.body?.gi_registry_document || '').trim();
    const giRegistryDocumentName = String(req.body?.gi_registry_document_name || '').trim().slice(0, 255);
    const pincode = '';

    if (!fullName || !phone || !email || !password || !confirmPassword || !profileImage || !profileLocation || !country || !giRegistryDocument) {
      return res.status(400).json({ detail: 'Complete all required profile and GI Registry fields.' });
    }
    if (!['individual', 'organisation'].includes(profileType)) return res.status(400).json({ detail: 'Choose Individual or Organisation.' });
    if (profileType === 'organisation' && !organisationName) return res.status(400).json({ detail: 'Organisation name is required.' });
    if (!validPhone(phone)) {
      return res.status(400).json({ detail: 'Enter valid mobile numbers.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ detail: 'Valid email is required.' });
    }
    if (aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({ detail: 'Aadhaar number must contain 12 digits.' });
    }
    if (!passwordIsStrong(password)) {
      return res.status(400).json({ detail: 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ detail: 'Password and confirm password do not match.' });
    }
    if (!validDataUrl(profileImage, 'image/png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return res.status(400).json({ detail: 'Profile image must be a PNG file up to 5 MB.' });
    }
    if (companyLogo && !validCompanyLogo(companyLogo)) {
      return res.status(400).json({ detail: 'Company logo must be a valid PNG, JPG, or WebP image up to 5 MB.' });
    }
    if (!validDataUrl(giRegistryDocument, 'application/pdf', Buffer.from('%PDF-'))) {
      return res.status(400).json({ detail: 'GI Registry document must be a PDF file up to 5 MB.' });
    }
    // OTP verification is temporarily disabled; email and mobile are stored normally.
    if (aadhaarNumber && !process.env.AADHAAR_ENCRYPTION_KEY) {
      return res.status(503).json({ detail: 'Aadhaar encryption is not configured. Leave Aadhaar blank or contact support.' });
    }

    const existing = await getUserByIdentifier(email);
    if (existing || (phone && await getUserByIdentifier(phone))) {
      return res.status(409).json({ detail: 'Email or mobile number is already registered.' });
    }
    // GSTIN and GST-linked mobile checks are intentionally disabled for now.

    const user = await insertUser({
      account_type: accountType,
      full_name: fullName,
      organisation_name: profileType === 'organisation' ? organisationName : null,
      gi_registry_match: isKnownKancheepuramOrganisation(organisationName),
      phone,
      email,
      password,
      profile_image: profileImage,
      company_logo: companyLogo || null,
      profile_location: profileLocation,
      aadhaar_number_encrypted: aadhaarNumber ? encryptAadhaar(aadhaarNumber) : null,
      gstin,
      gst_registered_phone: gstRegisteredPhone,
      gi_registry_document: giRegistryDocument,
      gi_registry_document_name: giRegistryDocumentName,
      village_area: villageArea,
      district,
      state,
      country,
      pincode,
      gps_coordinates: req.body?.gps_coordinates || '',
      latitude: req.body?.latitude,
      longitude: req.body?.longitude,
    });

    return res.status(201).json(authResponse(user));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ detail: 'Email or mobile number is already registered.' });
    }
    return next(error);
  }
});

router.post('/forgot-password', async (req, res) => {
  await ensureAuthSchema();
  const identifier = String(req.body?.identifier || '').trim();
  if (identifier) {
    try {
      await db.query('INSERT INTO password_reset_requests (identifier) VALUES ($1)', [identifier]);
    } catch {
      // Optional reset request table.
    }
  }
  return res.json({ message: 'If the account exists, password reset instructions will be sent.' });
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirm_password || '');

    if (!email || !email.includes('@')) {
      return res.status(400).json({ detail: 'Valid email is required.' });
    }
    if (!password || !confirmPassword) {
      return res.status(400).json({ detail: 'New password and confirm password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ detail: 'Password must be at least 8 characters.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ detail: 'Password and confirm password do not match.' });
    }

    await ensureAuthSchema();
    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = $2 RETURNING user_id',
      [hashPassword(password), email],
    );
    if (!result.rowCount) {
      return res.status(404).json({ detail: 'No account was found for this email.' });
    }

    return res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    return next(error);
  }
});

router.get('/google', (_req, res) => {
  return res.status(501).json({ detail: 'Google login is not configured for this local backend.' });
});

router.post('/logout', (_req, res) => {
  return res.json({ message: 'Logged out' });
});

const authMiddleware = require('../middleware/authMiddleware');

router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { name, company_logo, video_url, video_locked } = req.body;

    const fields = [];
    const values = [];
    let count = 1;

    if (name !== undefined) {
      fields.push(`full_name = $${count}`);
      values.push(name);
      count++;
    }
    if (company_logo !== undefined) {
      fields.push(`company_logo = $${count}`);
      values.push(company_logo);
      count++;
    }
    if (video_url !== undefined) {
      fields.push(`video_url = $${count}`);
      values.push(video_url);
      count++;
    }
    if (video_locked !== undefined) {
      fields.push(`video_locked = $${count}`);
      values.push(Boolean(video_locked));
      count++;
    }

    if (fields.length === 0) {
      return res.status(400).json({ detail: 'No fields to update.' });
    }

    values.push(userId);
    const query = `
      UPDATE users
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${count}
      RETURNING *
    `;

    const result = await db.query(query, values);
    const updatedUser = result.rows[0];
    if (!updatedUser) {
      return res.status(404).json({ detail: 'User not found.' });
    }

    const response = authResponse(updatedUser);
    return res.json(response.user);
  } catch (error) {
    return next(error);
  }
});

// Admin-only review endpoints. Admins are regular users with account_type=admin,
// but can never be created through the public signup form.
router.get('/admin/users', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ detail: 'Admin access required.' });
    await ensureAuthSchema();
    const result = await db.query(`
      SELECT user_id AS id, full_name AS name, email, mob AS phone, profile_location,
        account_type, profile_image, company_logo, village_area, district, state,
        country, gstin, mobile_verified, email_verified, gst_mobile_verified,
        gi_registry_document_name,
        gi_registry_document IS NOT NULL AS has_gi_registry_document,
        verification_status, is_verified, created_at, updated_at
      FROM users
      WHERE COALESCE(account_type, role, '') <> 'admin'
      ORDER BY created_at DESC NULLS LAST, user_id DESC
    `);
    return res.json({ users: result.rows });
  } catch (error) { return next(error); }
});

router.get('/admin/users/:id/gi-registry-document', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ detail: 'Admin access required.' });
    await ensureAuthSchema();
    const result = await db.query(`
      SELECT gi_registry_document, gi_registry_document_name
      FROM users
      WHERE user_id = $1 AND COALESCE(account_type, role, '') <> 'admin'
      LIMIT 1
    `, [Number(req.params.id)]);
    if (!result.rowCount || !result.rows[0].gi_registry_document) {
      return res.status(404).json({ detail: 'GI Registry document not found.' });
    }
    return res.json({
      document: result.rows[0].gi_registry_document,
      filename: result.rows[0].gi_registry_document_name || 'gi-registry-document.pdf',
    });
  } catch (error) { return next(error); }
});

router.patch('/admin/users/:id/status', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ detail: 'Admin access required.' });
    const status = String(req.body?.status || '').trim().toLowerCase();
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ detail: 'Status must be pending, approved, or rejected.' });
    }
    await ensureAuthSchema();
    const result = await db.query(`
      UPDATE users SET verification_status = $1, is_verified = $2, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $3 AND COALESCE(account_type, role, '') <> 'admin'
      RETURNING user_id AS id, verification_status, is_verified
    `, [status, status === 'approved', Number(req.params.id)]);
    if (!result.rowCount) return res.status(404).json({ detail: 'User not found.' });
    return res.json({ user: result.rows[0] });
  } catch (error) { return next(error); }
});

module.exports = router;
