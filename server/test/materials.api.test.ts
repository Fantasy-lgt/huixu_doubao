// 材料库接口集成测试（PRD-02 M-OK1/M-OK3/M-OK4、M-F1/M-F3/M-F6、A-F5 越权隔离）
import 'dotenv/config';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/plugins/prisma.js';

const PREFIX = `umt-${process.pid}-${Date.now().toString(36)}-`;
let seq = 0;
const nextEmail = () => `${PREFIX}${++seq}@example.test`;
const VALID_PWD = 'Passw0rd123';

let app: FastifyInstance;

before(async () => {
  app = await buildApp();
  await app.ready();
});

after(async () => {
  await prisma.material
    .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
    .catch(() => undefined);
  await prisma.session
    .deleteMany({ where: { user: { email: { startsWith: PREFIX } } } })
    .catch(() => undefined);
  await prisma.user
    .deleteMany({ where: { email: { startsWith: PREFIX } } })
    .catch(() => undefined);
  await app.close();
  await prisma.$disconnect();
});

function cookieSid(res: { headers: Record<string, unknown> }): string {
  const raw = res.headers['set-cookie'];
  const arr = Array.isArray(raw) ? raw : [raw as unknown as string];
  const hit = arr.find((c) => typeof c === 'string' && c.startsWith('sid=')) as string;
  return decodeURIComponent(hit.split(';')[0].split('=')[1]);
}

async function registerUser() {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email: nextEmail(), password: VALID_PWD, confirmPassword: VALID_PWD },
  });
  assert.equal(res.statusCode, 201);
  return { sid: cookieSid(res), userId: res.json().data.id as string };
}

const basePayload = {
  title: '十月综合部月报',
  materialType: 'work_report',
  tags: ['归档', '协调', '归档'],
  period: '2026-10',
  occasion: '月度管理会',
  body: '重点进展\n完成本月18份演示资料归档。\n问题风险\n部分资料缺少负责人。',
};

test('M-OK1 合法新建 201：字段落库正确、标签去重、来源名缺省、version=1', async () => {
  const { sid } = await registerUser();
  const res = await app.inject({
    method: 'POST',
    url: '/api/materials',
    headers: { cookie: `sid=${sid}` },
    payload: basePayload,
  });
  assert.equal(res.statusCode, 201);
  const d = res.json().data;
  assert.equal(d.title, '十月综合部月报');
  assert.equal(d.materialType, 'work_report');
  assert.deepEqual(d.tags, ['归档', '协调']);
  assert.equal(d.period, '2026-10');
  assert.equal(d.occasion, '月度管理会');
  assert.equal(d.sourceName, '手工录入');
  assert.equal(d.version, 1);
});

test('列表项携带 body 字段（前端卡片预览依赖正文），且为字符串', async () => {
  const { sid } = await registerUser();
  await app.inject({
    method: 'POST',
    url: '/api/materials',
    headers: { cookie: `sid=${sid}` },
    payload: basePayload,
  });
  const list = await app.inject({ method: 'GET', url: '/api/materials', headers: { cookie: `sid=${sid}` } });
  assert.equal(list.statusCode, 200);
  const rows = list.json().data as Array<Record<string, unknown>>;
  assert.ok(rows.length >= 1);
  assert.equal(typeof rows[0].body, 'string');
  assert.ok((rows[0].body as string).includes('完成本月18份演示资料归档'));
});

test('A-F5 两用户隔离：B 列表不见 A 的材料；直取 A 的 id 读改写删全 404', async () => {
  const a = await registerUser();
  const b = await registerUser();
  const create = await app.inject({
    method: 'POST',
    url: '/api/materials',
    headers: { cookie: `sid=${a.sid}` },
    payload: { ...basePayload, title: 'A 私有材料', period: '2026-10' },
  });
  const aId = create.json().data.id as string;

  const bList = await app.inject({ method: 'GET', url: '/api/materials', headers: { cookie: `sid=${b.sid}` } });
  assert.equal(bList.statusCode, 200);
  assert.deepEqual(bList.json().data, []);

  const bGet = await app.inject({ method: 'GET', url: `/api/materials/${aId}`, headers: { cookie: `sid=${b.sid}` } });
  assert.equal(bGet.statusCode, 404);
  assert.equal(bGet.json().error.code, 'NOT_FOUND');

  const bPut = await app.inject({
    method: 'PUT',
    url: `/api/materials/${aId}`,
    headers: { cookie: `sid=${b.sid}` },
    payload: basePayload,
  });
  assert.equal(bPut.statusCode, 404);

  const bDel = await app.inject({ method: 'DELETE', url: `/api/materials/${aId}`, headers: { cookie: `sid=${b.sid}` } });
  assert.equal(bDel.statusCode, 404);
});

test('M-F3 同 period + 同正文指纹判重 409；仅改标题仍判重；换 period 不判重', async () => {
  const { sid } = await registerUser();
  const first = await app.inject({
    method: 'POST',
    url: '/api/materials',
    headers: { cookie: `sid=${sid}` },
    payload: basePayload,
  });
  assert.equal(first.statusCode, 201);

  const dup = await app.inject({
    method: 'POST',
    url: '/api/materials',
    headers: { cookie: `sid=${sid}` },
    payload: { ...basePayload, title: '标题完全不同但正文相同' },
  });
  assert.equal(dup.statusCode, 409);
  assert.equal(dup.json().error.code, 'MATERIAL_DUPLICATE');

  const otherPeriod = await app.inject({
    method: 'POST',
    url: '/api/materials',
    headers: { cookie: `sid=${sid}` },
    payload: { ...basePayload, period: '2026-11' },
  });
  assert.equal(otherPeriod.statusCode, 201);
});

test('M-F6/M-F1 非法月份、非法类型、超长正文均 400 VALIDATION_FAILED', async () => {
  const { sid } = await registerUser();
  const badPeriod = await app.inject({
    method: 'POST',
    url: '/api/materials',
    headers: { cookie: `sid=${sid}` },
    payload: { ...basePayload, period: '2026-13' },
  });
  assert.equal(badPeriod.statusCode, 400);
  assert.equal(badPeriod.json().error.code, 'VALIDATION_FAILED');

  const badType = await app.inject({
    method: 'POST',
    url: '/api/materials',
    headers: { cookie: `sid=${sid}` },
    payload: { ...basePayload, materialType: 'not_a_type' },
  });
  assert.equal(badType.statusCode, 400);

  const tooLong = await app.inject({
    method: 'POST',
    url: '/api/materials',
    headers: { cookie: `sid=${sid}` },
    payload: { ...basePayload, body: 'x'.repeat(20001) },
  });
  assert.equal(tooLong.statusCode, 400);
});

test('空结果列表返回 200 空数组', async () => {
  const { sid } = await registerUser();
  const res = await app.inject({ method: 'GET', url: '/api/materials', headers: { cookie: `sid=${sid}` } });
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.json().data));
  assert.equal(res.json().data.length, 0);
});

test('M-OK4 PUT 更新标题后 version+1；更新查重排除自身', async () => {
  const { sid } = await registerUser();
  const created = await app.inject({
    method: 'POST',
    url: '/api/materials',
    headers: { cookie: `sid=${sid}` },
    payload: basePayload,
  });
  const id = created.json().data.id as string;

  const put = await app.inject({
    method: 'PUT',
    url: `/api/materials/${id}`,
    headers: { cookie: `sid=${sid}` },
    payload: { ...basePayload, title: '改后标题' },
  });
  assert.equal(put.statusCode, 200);
  assert.equal(put.json().data.version, 2);
  assert.equal(put.json().data.title, '改后标题');

  const detail = await app.inject({ method: 'GET', url: `/api/materials/${id}`, headers: { cookie: `sid=${sid}` } });
  assert.equal(detail.json().data.title, '改后标题');
  assert.equal(detail.json().data.version, 2);
});

test('关键词检索命中标题/正文，无命中返回空数组', async () => {
  const { sid } = await registerUser();
  await app.inject({
    method: 'POST',
    url: '/api/materials',
    headers: { cookie: `sid=${sid}` },
    payload: { ...basePayload, title: '冷却设备维护月报', body: '完成两台设备例行维护。' },
  });
  const hit = await app.inject({
    method: 'GET',
    url: '/api/materials?keyword=冷却',
    headers: { cookie: `sid=${sid}` },
  });
  assert.equal(hit.statusCode, 200);
  assert.ok(hit.json().data.length >= 1);

  const miss = await app.inject({
    method: 'GET',
    url: '/api/materials?keyword=不存在的关键词xyzq',
    headers: { cookie: `sid=${sid}` },
  });
  assert.equal(miss.statusCode, 200);
  assert.equal(miss.json().data.length, 0);
});
