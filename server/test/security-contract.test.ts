// m4 任务 C 补充：安全契约 + domain 纯函数纪律的独立测试（任务 C 允许新增，不改动任何业务实现）
// 覆盖：
//  1) 错误码 ↔ HTTP 状态映射契约（对齐 PRD-01 §5、PRD-02 §5；代码常量以 src/lib/result.ts 为准）
//  2) domain/ 目录静态纪律：无 ORM、无文件系统、无环境变量、无网络调用（对齐任务 A 纯函数要求）
//  3) 现有输入校验器的安全边界：控制字符、长度上限、整数区间、月份格式（供任务 E validators 复用基线）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { fail, ok, assertOwner, type ErrorCode } from '../src/lib/result.js';
import { AppError } from '../src/domain/errors.js';
import { str, integer, period } from '../src/domain/validation.js';

// ---------- 1. 错误码契约（B.2.4 口径表的可执行部分） ----------

test('错误码契约：业务错误码映射到约定 HTTP 状态，响应体统一 {error:{code,message}}', () => {
  const cases: Array<[ErrorCode, number]> = [
    ['EMAIL_TAKEN', 409],
    ['INVALID_CREDENTIALS', 401],
    ['ACCOUNT_DISABLED', 403],
    ['MATERIAL_DUPLICATE', 409],
    ['UNAUTHENTICATED', 401],
    ['NOT_FOUND', 404],
    ['VALIDATION_FAILED', 400],
  ];
  for (const [code, status] of cases) {
    const r = fail(code, 'contract-message', status);
    assert.equal(r.statusCode, status, `${code} 应映射 HTTP ${status}`);
    assert.deepEqual(r.body, { error: { code, message: 'contract-message' } });
    // 错误响应不得携带密码、哈希、SQL、堆栈等额外字段
    assert.deepEqual(Object.keys(r.body), ['error']);
    assert.deepEqual(Object.keys(r.body.error), ['code', 'message']);
  }
});

test('错误码契约：fail 默认状态 400；ok 统一包 {data}', () => {
  const r = fail('VALIDATION_FAILED', '参数有误');
  assert.equal(r.statusCode, 400);
  assert.deepEqual(ok({ id: 'x' }), { data: { id: 'x' } });
});

test('归属判定：assertOwner 对 null/undefined/他人记录均返回 false，仅本人 true（不暴露存在性）', () => {
  assert.equal(assertOwner(null, 'u1'), false);
  assert.equal(assertOwner(undefined, 'u1'), false);
  assert.equal(assertOwner({ userId: 'u2' }, 'u1'), false);
  assert.equal(assertOwner({ userId: 'u1' }, 'u1'), true);
});

// ---------- 2. domain 目录纯函数纪律（B.3.1 静态扫描，测试侧读取源码文本不构成 domain IO） ----------

const domainDir = fileURLToPath(new URL('../src/domain/', import.meta.url));

test('纯函数纪律：domain/*.ts 不引用 Prisma / fs / 环境变量 / 网络请求', () => {
  const files = readdirSync(domainDir).filter((f) => f.endsWith('.ts'));
  assert.ok(files.length > 0, '应扫描到 domain 源文件');
  const forbidden = [
    '@prisma/client',
    'node:fs',
    'fs/promises',
    'process.env',
    'fetch(',
    'prisma.',
  ];
  for (const file of files) {
    const src = readFileSync(path.join(domainDir, file), 'utf8');
    for (const token of forbidden) {
      assert.ok(!src.includes(token), `${file} 不应包含禁用引用: ${token}`);
    }
  }
});

// ---------- 3. 输入安全基础边界（B.2.6；现有校验器，任务 E 复用时不得放宽） ----------

test('str：非字符串、纯空白、超长抛错；C0 控制字符拒绝；换行与制表符允许保留', () => {
  assert.throws(() => str(123, '标题', 100), AppError);
  assert.throws(() => str('   ', '标题', 100), AppError);
  assert.throws(() => str('a'.repeat(101), '标题', 100), AppError);
  assert.throws(() => str('a\u0000b', '正文', 20000), /控制字符/);
  assert.throws(() => str('a\u001fb', '正文', 20000), /控制字符/);
  assert.equal(str('第一行\n第二行\t内容', '正文', 20000), '第一行\n第二行\t内容');
});

test('integer：非整数、越界抛错；区间内通过', () => {
  assert.throws(() => integer(2.5, 1, 12, '月份'), AppError);
  assert.throws(() => integer(0, 1, 12, '月份'), AppError);
  assert.throws(() => integer(13, 1, 12, '月份'), AppError);
  assert.equal(integer(6, 1, 12, '月份'), 6);
});

test('period：非法月份（00/13）、格式错、年份越界抛错；合法边界年通过', () => {
  for (const bad of ['2026-00', '2026-13', '2026/01', '1999-12', '2101-01', 202611]) {
    assert.throws(() => period(bad), AppError);
  }
  assert.equal(period('2000-01'), '2000-01');
  assert.equal(period('2100-12'), '2100-12');
});

// 备注：材料 period 允许空值（PRD-02 §2），空值放行属于任务 E validators/service 层分支，
// 本 period() 语义为「给定值必须是合法 YYYY-MM」，两者不冲突，见附录 B B.3 复审备注。
