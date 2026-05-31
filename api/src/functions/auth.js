'use strict';

const crypto = require('crypto');
const { app } = require('@azure/functions');
const {
  USERS_TABLE,
  getEntity,
  upsertEntity,
  jsonResponse,
} = require('../shared/tables');

function hashPassword(password, salt) {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, useSalt, 100_000, 32, 'sha256')
    .toString('hex');
  return { salt: useSalt, hash };
}

function makeRowKey(email) {
  return String(email).trim().toLowerCase();
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

app.http('register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: async (request) => {
    const body = await request.json();
    const { name, email, password, role } = body || {};
    if (!name || !email || !password || !role) {
      return jsonResponse(400, { error: 'Missing required fields' });
    }
    if (role !== 'tutor' && role !== 'student') {
      return jsonResponse(400, { error: 'Invalid role' });
    }

    const rowKey = makeRowKey(email);
    const existing = await getEntity(USERS_TABLE, role, rowKey);
    if (existing) {
      return jsonResponse(409, { error: 'Account already exists for this email and role' });
    }

    const { salt, hash } = hashPassword(password);
    const userId = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const user = {
      userId,
      name: String(name).trim(),
      email: String(email).trim(),
      role,
      passwordSalt: salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };
    await upsertEntity(USERS_TABLE, role, rowKey, user);
    return jsonResponse(201, publicUser(user));
  },
});

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: async (request) => {
    const body = await request.json();
    const { email, password, role } = body || {};
    if (!email || !password || !role) {
      return jsonResponse(400, { error: 'Missing required fields' });
    }
    const rowKey = makeRowKey(email);
    const user = await getEntity(USERS_TABLE, role, rowKey);
    if (!user) return jsonResponse(401, { error: 'Invalid credentials' });

    const { hash } = hashPassword(password, user.passwordSalt);
    if (hash !== user.passwordHash) {
      return jsonResponse(401, { error: 'Invalid credentials' });
    }
    return jsonResponse(200, publicUser(user));
  },
});

app.http('updateUserName', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/update-name',
  handler: async (request) => {
    const body = await request.json();
    const { email, role, name } = body || {};
    if (!email || !role || !name) {
      return jsonResponse(400, { error: 'Missing required fields' });
    }
    const rowKey = makeRowKey(email);
    const user = await getEntity(USERS_TABLE, role, rowKey);
    if (!user) return jsonResponse(404, { error: 'User not found' });
    user.name = String(name).trim();
    await upsertEntity(USERS_TABLE, role, rowKey, user);
    return jsonResponse(200, publicUser(user));
  },
});

app.http('deleteUser', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'auth/users/{role}/{email}',
  handler: async (request) => {
    const { role, email } = request.params;
    const rowKey = makeRowKey(email);
    const success = await deleteEntity(USERS_TABLE, role, rowKey);
    if (!success) return jsonResponse(404, { error: 'User not found' });
    return jsonResponse(204, null);
  },
});
