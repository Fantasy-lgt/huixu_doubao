// 业务错误：携带 http status 与错误码；错误处理中间件按 code 输出、不回显堆栈
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 抛错快捷方式；默认 400 / INVALID_INPUT
export function fail(message: string, status = 400, code = 'INVALID_INPUT'): never {
  throw new AppError(status, code, message);
}
