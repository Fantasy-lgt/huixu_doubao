// 账号入参校验（PRD-01 §3 FR-A01/FR-A02、§6 服务端为准）
// 校验失败抛 AppError(400, VALIDATION_FAILED)，由 app.ts 错误处理器统一映射。
import { fail } from '../domain/errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

function asRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
}

export function validateRegister(body: unknown): RegisterInput {
  const b = asRecord(body);
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  if (!email || email.length > 120 || !EMAIL_RE.test(email)) {
    fail('邮箱格式不合法', 400, 'VALIDATION_FAILED');
  }
  const password = typeof b.password === 'string' ? b.password : '';
  if (
    password.length < 8 ||
    password.length > 72 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    fail('密码须为 8–72 位且同时包含字母和数字', 400, 'VALIDATION_FAILED');
  }
  if (b.confirmPassword !== password) {
    fail('两次输入的密码不一致', 400, 'VALIDATION_FAILED');
  }
  return { email, password };
}

export function validateLogin(body: unknown): LoginInput {
  const b = asRecord(body);
  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  const password = typeof b.password === 'string' ? b.password : '';
  if (!email || !password) {
    fail('请输入邮箱和密码', 400, 'VALIDATION_FAILED');
  }
  return { email, password };
}
