import { randomUUID } from 'node:crypto';
import { fail } from './errors.js';

// 本机容量上限（迁移自初代 domain）
export const LIMITS = Object.freeze({
  body: 20000,
  item: 5000,
  items: 300,
  materials: 2000,
  drafts: 100,
  state: 6 * 1024 * 1024,
});

export const id = (): string => randomUUID();
export const now = (): string => new Date().toISOString();

// 字符串校验：非空、长度上限、剔除 C0 控制字符（保留 \t \n \r）
export function str(v: unknown, label: string, max: number, empty = false): string {
  if (
    typeof v !== 'string' ||
    (!empty && !v.trim()) ||
    v.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(v)
  ) {
    fail(`${label}为空、过长或含不支持的控制字符`);
  }
  return v as string;
}

// 整数范围校验
export function integer(v: unknown, min: number, max: number, label: string): number {
  if (!Number.isInteger(v) || (v as number) < min || (v as number) > max) {
    fail(`${label}无效`);
  }
  return v as number;
}

// 月份校验：2000-2100 年的有效 YYYY-MM
export function period(v: unknown): string {
  if (
    typeof v !== 'string' ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(v) ||
    Number(v.slice(0, 4)) < 2000 ||
    Number(v.slice(0, 4)) > 2100
  ) {
    fail('月份须为2000至2100年的有效 YYYY-MM');
  }
  return v;
}

// 当前上海时区的年月（用于默认期间与示例）
export function dateParts(date: Date = new Date()): { year: number; month: number } {
  const values = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  return {
    year: Number(values.find((x) => x.type === 'year')?.value),
    month: Number(values.find((x) => x.type === 'month')?.value),
  };
}
