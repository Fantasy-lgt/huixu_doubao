import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertOwner } from '../src/lib/result.js';

// 样例测试：资源归属校验（越权或不存在一律 false，对应 PRD-01 不暴露存在性）
test('assertOwner：行不存在时返回 false', () => {
  assert.equal(assertOwner(null, 'user-1'), false);
  assert.equal(assertOwner(undefined, 'user-1'), false);
});

test('assertOwner：资源不属于当前用户时返回 false', () => {
  assert.equal(assertOwner({ userId: 'user-other' }, 'user-1'), false);
});

test('assertOwner：资源属于当前用户时返回 true', () => {
  assert.equal(assertOwner({ userId: 'user-1' }, 'user-1'), true);
});
