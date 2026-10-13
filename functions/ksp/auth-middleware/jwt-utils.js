/**
 * JWT Utility Module for KSP Crime Intelligence Portal
 * Phase 1: Production-grade token management using HMAC-SHA256
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const ALLOWED_ROLES = new Set(['Investigator', 'Analyst', 'Supervisor', 'Policymaker']);
const BCRYPT_COST = 12;

function isProductionEnvironment() {
  return process.env.NODE_ENV === 'production' || process.env.CATALYST_ENV === 'production';
}

// Require secret from environment / vault (fail closed in production if missing)
function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    if (isProductionEnvironment() && Buffer.byteLength(process.env.JWT_SECRET) < 32) {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET must be at least 32 bytes in production.');
    }
    return process.env.JWT_SECRET;
  }
  if (isProductionEnvironment()) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in production environment.');
  }
  // Temporary runtime fallback secret for dev environment only
  if (!global.__DEV_JWT_SECRET) {
    global.__DEV_JWT_SECRET = crypto.randomBytes(32).toString('hex');
  }
  return global.__DEV_JWT_SECRET;
}

const TOKEN_EXPIRY_HOURS = 8;
const REFRESH_WINDOW_HOURS = 1;

/**
 * Base64url encode (RFC 7515)
 */
function base64urlEncode(data) {
  let str = typeof data === 'string' ? data : JSON.stringify(data);
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64url decode
 */
function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Create HMAC-SHA256 signature
 */
function createSignature(headerPayload) {
  return crypto
    .createHmac('sha256', getJwtSecret())
    .update(headerPayload)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Hash a password using bcrypt. The seed and login paths share this format.
 */
function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hashSync(password, BCRYPT_COST);
}

/**
 * Verify bcrypt hashes and support a one-time upgrade of legacy salted SHA-256
 * hashes created by earlier synthetic seed data.
 */
function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') return false;

  if (/^\$2[aby]\$\d{2}\$/.test(storedHash)) {
    try {
      return bcrypt.compareSync(password, storedHash);
    } catch {
      return false;
    }
  }

  const separator = storedHash.indexOf(':');
  if (separator <= 0) return false;
  const salt = storedHash.slice(0, separator);
  const expectedHash = storedHash.slice(separator + 1);
  if (!/^[a-f0-9]{64}$/i.test(expectedHash)) return false;
  const actualHash = crypto.createHash('sha256').update(salt + password).digest();
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  return actualHash.length === expectedBuffer.length && crypto.timingSafeEqual(actualHash, expectedBuffer);
}

function needsPasswordRehash(storedHash) {
  return typeof storedHash !== 'string' || !/^\$2[aby]\$\d{2}\$/.test(storedHash);
}

/**
 * Generate a JWT token for an authenticated officer
 * @param {Object} officer — { badge_id, name, rank, role, district, police_station }
 * @returns {string} JWT token string
 */
function generateToken(officer) {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: officer.badge_id,
    name: officer.name,
    rank: officer.rank,
    role: officer.role,
    district: officer.district,
    policeStation: officer.police_station,
    iat: now,
    exp: now + (TOKEN_EXPIRY_HOURS * 3600)
  };

  const headerEncoded = base64urlEncode(header);
  const payloadEncoded = base64urlEncode(payload);
  const signature = createSignature(`${headerEncoded}.${payloadEncoded}`);

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Verify and decode a JWT token
 * @param {string} token — JWT token string
 * @returns {Object} decoded payload
 * @throws {Error} if token is invalid or expired
 */
function verifyToken(token) {
  if (!token) throw new Error('Token is required');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');

  const [headerEncoded, payloadEncoded, signature] = parts;

  let header;
  try {
    header = JSON.parse(base64urlDecode(headerEncoded));
  } catch {
    throw new Error('Invalid token header');
  }
  if (!header || header.alg !== 'HS256' || header.typ !== 'JWT') {
    throw new Error('Unsupported token header');
  }

  const expectedSignature = createSignature(`${headerEncoded}.${payloadEncoded}`);
  const providedSignature = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);
  if (
    providedSignature.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(providedSignature, expectedSignatureBuffer)
  ) {
    throw new Error('Invalid token signature');
  }

  // Decode payload
  let payload;
  try {
    payload = JSON.parse(base64urlDecode(payloadEncoded));
  } catch (e) {
    throw new Error('Invalid token payload');
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (
    !payload ||
    typeof payload.sub !== 'string' ||
    !payload.sub ||
    !ALLOWED_ROLES.has(payload.role) ||
    !Number.isFinite(payload.exp)
  ) {
    throw new Error('Invalid token claims');
  }
  if (payload.exp <= now) {
    throw new Error('Token has expired');
  }

  return payload;
}

/**
 * Refresh a token if within the refresh window
 * @param {string} token — existing JWT token
 * @returns {string|null} new token or null if not in refresh window
 */
function refreshToken(token) {
  const payload = verifyToken(token);
  
  const now = Math.floor(Date.now() / 1000);
  const timeToExpiry = payload.exp - now;
  const refreshWindowSeconds = REFRESH_WINDOW_HOURS * 3600;

  // Only refresh if within the last hour of validity
  if (timeToExpiry > refreshWindowSeconds) {
    return null; // Token still has plenty of time
  }

  // Generate a new token with the same officer details
  return generateToken({
    badge_id: payload.sub,
    name: payload.name,
    rank: payload.rank,
    role: payload.role,
    district: payload.district,
    police_station: payload.policeStation
  });
}

module.exports = {
  generateToken,
  verifyToken,
  refreshToken,
  hashPassword,
  verifyPassword,
  needsPasswordRehash
};
