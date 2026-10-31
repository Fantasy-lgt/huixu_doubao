import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface CurrentUser {
  id: string;
  email: string;
}

// 账号与会话：当前登录用户、登录态初始化
export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<CurrentUser | null>(null);
  const loading = ref(false);
  const initialized = ref(false);

  function isLoggedIn() {
    return currentUser.value !== null;
  }

  // TODO(W2): 接入 GET /api/auth/me、POST /api/auth/login、/register、/logout（api 模块待建）
  async function fetchMe() {
    /* W2 填充：拉当前用户，未登录 401 时保持 null */
  }
  async function login(_email: string, _password: string) {
    /* W2 填充：成功后写 currentUser */
  }
  async function register(_email: string, _password: string) {
    /* W2 填充 */
  }
  async function logout() {
    /* W2 填充：清空 currentUser */
  }

  return { currentUser, loading, initialized, isLoggedIn, fetchMe, login, register, logout };
});
