// 材料正文指纹（PRD-02 §2.3 去重规则）：纯函数，可脱离数据库单测。
// 规范化规则：去 \r、逐行 trim、丢弃空行、删除全部剩余空白字符；标题不参与指纹。
import { createHash } from 'node:crypto';

export function normalizeForFingerprint(body: string): string {
  return body
    .replace(/\r/g, '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('')
    .replace(/\s+/g, '');
}

export function fingerprint(body: string): string {
  return createHash('sha256').update(normalizeForFingerprint(body), 'utf8').digest('hex');
}
