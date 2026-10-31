// 统一请求封装：带 Cookie；统一解包 {data} / {error:{code,message}}；401 统一跳登录占位
// W2 接入真实会话后补充 token 刷新与错误码映射（对照任务流异常矩阵）

export interface ApiError {
  code: string;
  message: string;
}

export class RequestError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (res.status === 401) {
    // TODO(W2): 清前端态并 router.push({ path:'/login', query:{ redirect: location.pathname } })
    throw new RequestError('UNAUTHENTICATED', body?.error?.message ?? '登录已过期', 401);
  }
  if (!res.ok) {
    throw new RequestError(body?.error?.code ?? 'SERVER_ERR', body?.error?.message ?? '请求失败', res.status);
  }
  return (body?.data ?? body) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'POST', body: payload ? JSON.stringify(payload) : undefined }),
  put: <T>(path: string, payload?: unknown) =>
    request<T>(path, { method: 'PUT', body: payload ? JSON.stringify(payload) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
