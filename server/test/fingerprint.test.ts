import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fingerprint, normalizeForFingerprint } from '../src/domain/fingerprint.js';

test('fingerprint：空白、换行、\\r 差异不影响指纹（去重看正文实质）', () => {
  const a = '重点进展\r\n 完成归档 18 份。\n\n问题风险 待补充。';
  const b = '重点进展\n完成归档18份。\n\n\n问题风险待补充。';
  assert.equal(fingerprint(a), fingerprint(b));
  assert.equal(normalizeForFingerprint(a), '重点进展完成归档18份。问题风险待补充。');
});

test('fingerprint：正文实质不同则哈希不同；结果为 64 位 hex；同输入稳定', () => {
  const h1 = fingerprint('完成本月归档工作。');
  const h2 = fingerprint('完成本月归档工作，但结论不同。');
  assert.notEqual(h1, h2);
  assert.match(h1, /^[0-9a-f]{64}$/);
  assert.equal(fingerprint('重复输入'), fingerprint('重复输入'));
});
