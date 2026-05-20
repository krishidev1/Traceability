const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

let jwt;
try {
  jwt = require('jsonwebtoken');
} catch {
  jwt = require('../authenticationService/node_modules/jsonwebtoken');
}

const db = require('../config/db');

function getJwtSecrets() {
  return [
    process.env.JWT_SECRET_KEY,
    process.env.JWT_SECRET,
    process.env.JWT_SECRET_KEY_ALT,
    'change_me',
  ].filter(Boolean);
}

function verifyToken(token) {
  const options = { algorithms: ['HS256'] };
  const issuer = process.env.JWT_ISSUER || 'internlabs-auth-service';
  const audience = process.env.JWT_AUDIENCE || 'internlabs-api';
  const optionVariants = [
    { ...options, issuer, audience },
    options,
  ];

  for (const secret of getJwtSecrets()) {
    for (const opts of optionVariants) {
      try {
        return jwt.verify(token, secret, opts);
      } catch {
        // Try the next configured secret/options pair.
      }
    }
  }
  return null;
}

async function resolveUser(userId) {
  try {
    const result = await db.query(
      `
      SELECT
        user_id,
        COALESCE(account_type, role, 'grower') AS role,
        full_name AS name,
        email
      FROM users
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId],
    );
    return result.rows[0] || null;
  } catch {
    return { user_id: userId, role: 'grower' };
  }
}

function appRole(role) {
  const value = String(role || '').trim().toLowerCase();
  return ['supplier', 'exporter', 'retailer'].includes(value) ? 'supplier' : 'grower';
}

module.exports = async function authMiddleware(req, res, next) {
  const header = String(req.headers.authorization || '');
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing authorization token.' });
  }

  const payload = verifyToken(token);
  const userId = Number(payload && payload.sub);

  if (!payload || !Number.isFinite(userId)) {
    return res.status(401).json({ error: 'Invalid authorization token.' });
  }

  const user = await resolveUser(userId);
  req.auth = { userId };
  req.user = {
    user_id: Number(user?.user_id || userId),
    role: appRole(user?.role),
    name: user?.name || '',
    email: user?.email || '',
  };

  return next();
};
