// 统一错误响应：{ error: { code, message } }；不回显堆栈与密钥
// 错误码与前端任务流 F1/F3 分支一一对应
export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'MATERIAL_DUPLICATE'
  | 'AUTH_FAIL'      // 模型 401/403
  | 'RATE_LIMIT'     // 模型 429
  | 'TIMEOUT'
  | 'BAD_JSON'
  | 'SERVER_ERR';

export function fail(code: ErrorCode, message: string, httpStatus = 400) {
  return { statusCode: httpStatus, body: { error: { code, message } } };
}

export function ok<T>(data: T) {
  return { data };
}

// 资源归属校验：找不到或不属于当前用户一律 NOT_FOUND（不暴露存在性，PRD-01 4.2）
export function assertOwner(
  row: { userId: string } | null | undefined,
  currentUserId: string
) {
  if (!row || row.userId !== currentUserId) return false;
  return true;
}
