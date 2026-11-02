import { api } from './http';

// 后端白名单响应（不含 passwordHash）：id/email/emailPrefix/plan/createdAt
export interface AuthUser {
  id: string;
  email: string;
  emailPrefix: string;
  plan: string;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
}

export const authApi = {
  register: (payload: RegisterPayload) => api.post<AuthUser>('/auth/register', payload),
  login: (payload: LoginPayload) => api.post<AuthUser>('/auth/login', payload),
  logout: () => api.post<{ ok: boolean }>('/auth/logout'),
  me: () => api.get<AuthUser>('/auth/me'),
};
