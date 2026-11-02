import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authApi, type AuthUser } from '@/api/auth';

// 对齐后端白名单响应（不含 passwordHash）
export type CurrentUser = AuthUser;

// 账号与会话：当前用户、加载/错误态、初始化标记；凭证只经 HttpOnly Cookie，不落本地存储
export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<CurrentUser | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);

  const isLoggedIn = computed(() => currentUser.value !== null);

  // 启动守卫调用：401 或网络失败静默置 null，不抛错阻断路由
  async function fetchMe(): Promise<void> {
    try {
      currentUser.value = await authApi.me();
    } catch {
      currentUser.value = null;
    } finally {
      initialized.value = true;
    }
  }

  async function login(email: string, password: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      currentUser.value = await authApi.login({ email, password });
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败，请稍后重试';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function register(email: string, password: string, confirmPassword: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      currentUser.value = await authApi.register({ email, password, confirmPassword });
    } catch (err) {
      error.value = err instanceof Error ? err.message : '注册失败，请稍后重试';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch {
      // 后端会话已失效时也清本地态，不阻断退出流程
    }
    currentUser.value = null;
    error.value = null;
  }

  // 401 拦截器使用：只清前端态，不调后端（会话已不可信）
  function clearLocal(): void {
    currentUser.value = null;
    error.value = null;
  }

  return {
    currentUser,
    loading,
    error,
    initialized,
    isLoggedIn,
    fetchMe,
    login,
    register,
    logout,
    clearLocal,
  };
});
