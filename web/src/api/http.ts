// 统一请求封装：携带 Cookie（credentials:'include'）；统一解包 {data} / {error:{code,message}}。
// 401 不直接 import router/store（避免循环依赖）：由 main.ts 通过 setUnauthorizedHandler 注入清态与跳转。

export interface ApiError {
  code: string;
  message: string;
}

export class RequestError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'RequestError';
    this.code = code;
    this.status = status;
  }
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

const BASE = '/api';

export async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      ...options,
    });
  } catch {
    // fetch reject：断网 / 服务未启动 / 代理失败，统一网络错误
    throw new RequestError('NETWORK_ERROR', '网络异常，请稍后重试', 0);
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null; // 服务端返回非 JSON（如 502 文本），交给状态码分支兜底
  }
  const errBody = (body ?? {}) as { error?: ApiError };

  if (res.status === 401) {
    unauthorizedHandler?.();
    throw new RequestError('UNAUTHENTICATED', errBody.error?.message ?? '登录已过期，请重新登录', 401);
  }
  if (!res.ok) {
    throw new RequestError(
      errBody.error?.code ?? 'SERVER_ERR',
      errBody.error?.message ?? '请求失败，请稍后重试',
      res.status
    );
  }
  return ((body as { data?: T })?.data ?? (body as T)) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }),
  put: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'PUT', body: payload ? JSON.stringify(payload) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
