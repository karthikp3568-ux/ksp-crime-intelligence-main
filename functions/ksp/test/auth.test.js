const assert = require('assert');
const crypto = require('crypto');
const {
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  needsPasswordRehash
} = require('../auth-middleware/jwt-utils');
const authMiddleware = require('../auth-middleware');

// Set test environment secret
process.env.JWT_SECRET = 'test-secret-ksp-2026-audit-verification-key-9988';

console.log('--- Running Phase 1 Authorization Test Suite ---');

// Test 1: JWT token generation and verification
const mockOfficer = {
  badge_id: 'INV-1001',
  name: 'Meera Nair',
  rank: 'SI',
  role: 'Investigator',
  district: 'Bengaluru City',
  police_station: 'Bengaluru City Central PS'
};

const token = generateToken(mockOfficer);
assert.ok(token && typeof token === 'string', 'Token should be generated');

const decoded = verifyToken(token);
assert.strictEqual(decoded.sub, 'INV-1001', 'Badge ID must match sub claim');
assert.strictEqual(decoded.role, 'Investigator', 'Role must match payload');
console.log('✓ Test 1 Passed: Valid JWT Generation & Decoding');

// Passwords use bcrypt; legacy synthetic SHA-256 hashes verify once for rehash-on-login.
const bcryptHash = hashPassword('correct horse battery staple');
assert.ok(/^\$2[aby]\$12\$/.test(bcryptHash), 'New password hashes must use bcrypt cost 12');
assert.ok(verifyPassword('correct horse battery staple', bcryptHash), 'Correct password must verify');
assert.ok(!verifyPassword('wrong password', bcryptHash), 'Incorrect password must not verify');
assert.strictEqual(needsPasswordRehash(bcryptHash), false, 'Bcrypt hash must not require rehash');

const legacySalt = 'legacy-synthetic-salt';
const legacyDigest = crypto.createHash('sha256').update(legacySalt + 'legacy-password').digest('hex');
const legacyHash = `${legacySalt}:${legacyDigest}`;
assert.ok(verifyPassword('legacy-password', legacyHash), 'Legacy demo hash must verify for upgrade');
assert.ok(!verifyPassword('wrong-password', legacyHash), 'Legacy hash must reject a wrong password');
assert.strictEqual(needsPasswordRehash(legacyHash), true, 'Legacy hash must require bcrypt rehash');
console.log('✓ Test 2 Passed: Bcrypt Password Hashing and Legacy Hash Upgrade');

const base64url = value => Buffer.from(JSON.stringify(value)).toString('base64url');
assert.throws(
  () => verifyToken(`${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url({ sub: 'INV-1001', role: 'Investigator', exp: Date.now() / 1000 + 60 })}.demo_signature`),
  /Invalid token signature/,
  'Development must reject the legacy demo signature'
);
assert.throws(
  () => verifyToken(`${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ sub: 'INV-1001', role: 'Investigator', exp: Date.now() / 1000 + 60 })}.demo_signature`),
  /Unsupported token header/,
  'Unsigned or unsupported token algorithms must be rejected'
);
console.log('✓ Test 3 Passed: Demo and Unsupported JWT Signatures Rejected');

// Test 2: Reject requests with missing Authorization header
const mockReqNoAuth = {
  path: '/api/cases',
  headers: {}
};
let statusCalled = null;
let jsonCalled = null;
const mockResNoAuth = {
  status: (code) => {
    statusCalled = code;
    return {
      json: (data) => { jsonCalled = data; }
    };
  }
};

authMiddleware(mockReqNoAuth, mockResNoAuth, () => {
  assert.fail('Should not call next() on unauthenticated request');
});
assert.strictEqual(statusCalled, 401, 'Must return 401 Unauthorized for missing token');
console.log('✓ Test 2 Passed: Missing Auth Header Rejected (401)');

// Test 3: Reject requests attempting legacy x-user-id / x-user-role header bypass
const mockReqLegacyBypass = {
  path: '/api/cases',
  headers: {
    'x-user-id': 'INV-1001',
    'x-user-role': 'Investigator'
  }
};
statusCalled = null;
jsonCalled = null;

authMiddleware(mockReqLegacyBypass, mockResNoAuth, () => {
  assert.fail('Should not allow legacy header bypass');
});
assert.strictEqual(statusCalled, 401, 'Legacy x-user-id header bypass must be rejected');
console.log('✓ Test 3 Passed: Legacy Header Bypass Blocked (401)');

// Test 4: Role context attachment for valid Bearer token
const mockReqValid = {
  path: '/api/cases',
  headers: {
    'authorization': `Bearer ${token}`
  }
};
let nextCalled = false;

authMiddleware(mockReqValid, {}, () => {
  nextCalled = true;
});
assert.ok(nextCalled, 'Next middleware must be invoked for valid token');
assert.strictEqual(mockReqValid.user.userId, 'INV-1001', 'Decoded user ID attached to req.user');
assert.strictEqual(mockReqValid.user.role, 'Investigator', 'Decoded role attached to req.user');
console.log('✓ Test 4 Passed: Role & Context Attached to req.user');

// Test 5: Verify all four operational roles (Investigator, Analyst, Supervisor, Policymaker)
const roles = ['Investigator', 'Analyst', 'Supervisor', 'Policymaker'];
roles.forEach(role => {
  const roleOfficer = { ...mockOfficer, role };
  const roleToken = generateToken(roleOfficer);
  const req = { path: '/api/analytics', headers: { 'authorization': `Bearer ${roleToken}` } };
  let called = false;
  authMiddleware(req, {}, () => { called = true; });
  assert.ok(called, `Middleware must accept valid token for role: ${role}`);
  assert.strictEqual(req.user.role, role, `Role attached to request must be ${role}`);
});
console.log('✓ Test 5 Passed: Multi-Role Context Matrix Validated (Investigator, Analyst, Supervisor, Policymaker)');

console.log('=== Phase 1 Authorization Test Suite: ALL TESTS PASSED ===');
