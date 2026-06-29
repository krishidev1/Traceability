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

function optionalNumber(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();
  return ACCOUNT_TYPE_ALIASES.get(value) || 'grower';
}

function appRole(role) {
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
          ADD COLUMN IF NOT EXISTS profile_image text,
          ADD COLUMN IF NOT EXISTS company_logo text,
          ADD COLUMN IF NOT EXISTS video_url text,
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
          ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
      `);

      await db.query(`
        CREATE INDEX IF NOT EXISTS users_mob_idx
          ON public.users (mob)
          WHERE mob IS NOT NULL AND mob <> '';
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
      COALESCE(role, account_type, 'grower') AS role,
      account_type,
      profile_image,
      company_logo,
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
      role,
      full_name,
      mob,
      email,
      password_hash,
      profile_image,
      company_logo,
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
      $1, $2, $3, $4, $5, $6, $7, $8, NULL,
      $9, $10, $11, $12, $13, $14, $15, $16,
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
      role,
      data.full_name,
      data.phone,
      data.email,
      hashPassword(data.password),
      data.profile_image || null,
      data.company_logo || null,
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
      video_url: user.video_url || '',
      village_area: user.village_area || '',
      district: user.district || '',
      state: user.state || '',
      country: user.country || '',
      pincode: user.pincode || '',
      gps_coordinates: user.gps_coordinates || '',
      is_verified: Boolean(user.is_verified),
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

router.post('/signup', async (req, res, next) => {
  try {
    const accountType = normalizeRole(req.body?.account_type);
    const fullName = String(req.body?.full_name || req.body?.name || '').trim();
    const phone = normalizePhone(req.body?.phone);
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const confirmPassword = String(req.body?.confirm_password || '');
    const profileImage = String(req.body?.profile_image || '').trim();
    const companyLogo = String(req.body?.company_logo || '').trim();
    const villageArea = String(req.body?.village_area || '').trim();
    const district = String(req.body?.district || '').trim();
    const state = String(req.body?.state || '').trim();
    const country = String(req.body?.country || '').trim();
    const pincode = String(req.body?.pincode || '').trim();

    if (!fullName || !phone || !email || !password || !confirmPassword || !profileImage) {
      return res.status(400).json({ detail: 'Full name, mobile number, email, password, confirm password, and profile photo are required.' });
    }
    if (!email.includes('@')) {
      return res.status(400).json({ detail: 'Valid email is required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ detail: 'Password must be at least 8 characters.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ detail: 'Password and confirm password do not match.' });
    }
    if (!villageArea || !district || !state || !country) {
      return res.status(400).json({ detail: 'Village/area, district, state, and country are required.' });
    }

    const existing = await getUserByIdentifier(email);
    if (existing || (phone && await getUserByIdentifier(phone))) {
      return res.status(409).json({ detail: 'Email or mobile number is already registered.' });
    }

    const user = await insertUser({
      account_type: accountType,
      full_name: fullName,
      phone,
      email,
      password,
      profile_image: profileImage,
      company_logo: companyLogo || null,
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
    const { name, company_logo, video_url } = req.body;

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

module.exports = router;
