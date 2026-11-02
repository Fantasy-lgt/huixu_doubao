// 账号接口集成测试（PRD-01 A-OK1~OK4、A-F1~F4；app.inject 不占端口；直连本机 PG）
import 'dotenv/config';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import argon2 from 'argon2';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/plugins/prisma.js';

const PREFIX = `uit-${process.pid}-${Date.now().toString(36)}-`;
let seq = 0;
const nextEmail = () => `${PREFIX}${++seq}@example.test`;

let app: FastifyInstance;

before(async () => {
  app = await buildApp();
  await app.ready();
});

after(async () => {
  await prisma.session
    .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
    .catch(() => undefined);
  await prisma.user
    .deleteMany({ where: { email: { startsWith: PREFIX } } })
    .catch(() => undefined);
  await app.close();
  await prisma.$disconnect();
});

function cookieSid(res: { headers: Record<string, unknown> }): string | null {
  const raw = res.headers['set-cookie'];
  if (!raw) return null;
  const arr = Array.isArray(raw) ? raw : [raw as unknown as string];
  const hit = arr.find((c) => typeof c === 'string' && c.startsWith('sid=')) as
    | string
    | undefined;
  if (!hit) return null;
  return decodeURIComponent(hit.split(';')[0].split('=')[1]);
}

const VALID_PWD = 'Passw0rd123';

test('A-OK1 注册成功 201：落库为 argon2id 哈希、响应不含哈希、种 HttpOnly Cookie', async () => {
  const email = nextEmail();
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password: VALID_PWD, confirmPassword: VALID_PWD },
  });
  assert.equal(res.statusCode, 201);
  const body = res.json();
  assert.equal(body.data.email, email);
  assert.ok(body.data.id);
  assert.equal(body.data.plan, 'free');
  assert.ok('emailPrefix' in body.data);
  assert.ok(!('passwordHash' in body.data));

  const sid = cookieSid(res);
  assert.ok(sid, '应下发 sid Cookie');
  const rawSet = res.headers['set-cookie'];
  const setCookie = Array.isArray(rawSet) ? rawSet : rawSet ? [rawSet] : [];
  assert.ok(setCookie.some((c) => typeof c === 'string' && /HttpOnly/i.test(c)));
  assert.ok(setCookie.some((c) => typeof c === 'string' && /SameSite=Lax/i.test(c)));

  const row = await prisma.user.findUnique({ where: { email } });
  assert.ok(row);
  assert.ok(row!.passwordHash.startsWith('$argon2id$'), '库里必须是 argon2id 哈希');
  assert.notEqual(row!.passwordHash, VALID_PWD);
});

test('A-F2 重复邮箱注册 409 EMAIL_TAKEN，不新增记录', async () => {
  const email = nextEmail();
  await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password: VALID_PWD, confirmPassword: VALID_PWD },
  });
  const beforeCount = await prisma.user.count({ where: { email } });
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password: VALID_PWD, confirmPassword: VALID_PWD },
  });
  assert.equal(res.statusCode, 409);
  assert.equal(res.json().error.code, 'EMAIL_TAKEN');
  const afterCount = await prisma.user.count({ where: { email } });
  assert.equal(afterCount, beforeCount);
});

test('A-F1 非法入参矩阵统一 400 VALIDATION_FAILED', async () => {
  const cases = [
    { email: 'bad-email', password: VALID_PWD, confirmPassword: VALID_PWD },
    { email: nextEmail(), password: 'short1', confirmPassword: 'short1' },
    { email: nextEmail(), password: 'onlyletters', confirmPassword: 'onlyletters' },
    { email: nextEmail(), password: '12345678', confirmPassword: '12345678' },
    { email: nextEmail(), password: VALID_PWD, confirmPassword: 'Different123' },
  ];
  for (const payload of cases) {
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', payload });
    assert.equal(res.statusCode, 400, `payload=${JSON.stringify(payload)}`);
    assert.equal(res.json().error.code, 'VALIDATION_FAILED');
  }
});

test('A-F3 未知邮箱与错误密码同为 401 INVALID_CREDENTIALS，文案不区分', async () => {
  const email = nextEmail();
  await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password: VALID_PWD, confirmPassword: VALID_PWD },
  });
  const unknown = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email: nextEmail(), password: VALID_PWD },
  });
  const wrongPwd = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password: 'WrongPass999' },
  });
  assert.equal(unknown.statusCode, 401);
  assert.equal(unknown.json().error.code, 'INVALID_CREDENTIALS');
  assert.equal(wrongPwd.statusCode, 401);
  assert.equal(wrongPwd.json().error.code, 'INVALID_CREDENTIALS');
  assert.equal(unknown.json().error.message, wrongPwd.json().error.message);
});

test('停用用户登录 403 ACCOUNT_DISABLED', async () => {
  const email = nextEmail();
  const hash = await argon2.hash(VALID_PWD, { type: argon2.argon2id });
  await prisma.user.create({ data: { email, passwordHash: hash, plan: 'free', status: 'disabled' } });
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password: VALID_PWD },
  });
  assert.equal(res.statusCode, 403);
  assert.equal(res.json().error.code, 'ACCOUNT_DISABLED');
});

test('A-OK2/A-OK4 登录种 Cookie，/me 返回白名单字段；logout 后旧 Cookie 访问 /me 401', async () => {
  const email = nextEmail();
  await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password: VALID_PWD, confirmPassword: VALID_PWD },
  });
  const login = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password: VALID_PWD },
  });
  assert.equal(login.statusCode, 200);
  const sid = cookieSid(login);
  assert.ok(sid);

  const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: `sid=${sid}` } });
  assert.equal(me.statusCode, 200);
  const meData = me.json().data;
  for (const field of ['id', 'email', 'emailPrefix', 'plan', 'createdAt']) {
    assert.ok(field in meData, `/me 应包含 ${field}`);
  }
  assert.ok(!('passwordHash' in meData));

  const logout = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie: `sid=${sid}` } });
  assert.equal(logout.statusCode, 200);

  const after = await app.inject({ method: 'GET', url: '/api/auth/me', headers: { cookie: `sid=${sid}` } });
  assert.equal(after.statusCode, 401);
  assert.equal(after.json().error.code, 'UNAUTHENTICATED');
});

test('A-F4 未登录访问业务接口 401 UNAUTHENTICATED', async () => {
  const res = await app.inject({ method: 'GET', url: '/api/materials' });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().error.code, 'UNAUTHENTICATED');
});
