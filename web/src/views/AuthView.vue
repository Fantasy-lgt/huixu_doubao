<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <div class="mode-tabs">
        <button
          type="button"
          :class="['tab', { active: mode === 'login' }]"
          @click="switchMode('login')"
        >
          登录
        </button>
        <button
          type="button"
          :class="['tab', { active: mode === 'register' }]"
          @click="switchMode('register')"
        >
          注册
        </button>
      </div>

      <h2>{{ mode === 'login' ? '登录汇序 Pro' : '注册新账号' }}</h2>
      <p class="tip">邮箱 + 密码；密码 8–72 位且含字母和数字；凭证仅由 HttpOnly Cookie 保存。</p>

      <p v-if="summary" class="summary" role="alert">{{ summary }}</p>

      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span class="label">邮箱</span>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="name@example.com"
            :disabled="submitting"
          />
          <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>
        </label>

        <label class="field">
          <span class="label">密码</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="至少 8 位，同时包含字母和数字"
            :disabled="submitting"
          />
          <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
        </label>

        <label v-if="mode === 'register'" class="field">
          <span class="label">确认密码</span>
          <input
            v-model="form.confirmPassword"
            type="password"
            autocomplete="new-password"
            placeholder="再次输入密码"
            :disabled="submitting"
          />
          <span v-if="fieldErrors.confirmPassword" class="field-error">{{ fieldErrors.confirmPassword }}</span>
        </label>

        <button class="submit" type="submit" :disabled="submitting">
          {{ submitting ? '请稍候…' : mode === 'login' ? '登录' : '注册并进入' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { RequestError } from '@/api/http';

type Mode = 'login' | 'register';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const mode = ref<Mode>('login');
const submitting = ref(false);
const summary = ref('');
const form = reactive({ email: '', password: '', confirmPassword: '' });
const fieldErrors = reactive<{ email?: string; password?: string; confirmPassword?: string }>({});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clearFieldErrors() {
  fieldErrors.email = undefined;
  fieldErrors.password = undefined;
  fieldErrors.confirmPassword = undefined;
}

function switchMode(next: Mode) {
  mode.value = next;
  summary.value = '';
  clearFieldErrors();
}

function validate(): boolean {
  clearFieldErrors();
  let ok = true;
  if (!EMAIL_RE.test(form.email.trim())) {
    fieldErrors.email = '邮箱格式不合法';
    ok = false;
  }
  const pwd = form.password;
  if (pwd.length < 8 || pwd.length > 72 || !/[A-Za-z]/.test(pwd) || !/\d/.test(pwd)) {
    fieldErrors.password = '密码须为 8–72 位且同时包含字母和数字';
    ok = false;
  }
  if (mode.value === 'register' && form.confirmPassword !== pwd) {
    fieldErrors.confirmPassword = '两次输入的密码不一致';
    ok = false;
  }
  return ok;
}

function mapError(err: unknown): string {
  if (err instanceof RequestError) {
    switch (err.code) {
      case 'EMAIL_TAKEN':
        return '该邮箱已注册，可直接登录';
      case 'INVALID_CREDENTIALS':
        return '邮箱或密码不正确';
      case 'ACCOUNT_DISABLED':
        return '账号不可用，请联系支持';
      case 'NETWORK_ERROR':
        return err.message;
      case 'VALIDATION_FAILED':
        return err.message;
      default:
        return err.message || '请求失败，请稍后重试';
    }
  }
  return '请求失败，请稍后重试';
}

async function submit() {
  summary.value = '';
  if (!validate()) return;
  submitting.value = true;
  try {
    const email = form.email.trim().toLowerCase();
    if (mode.value === 'register') {
      await auth.register(email, form.password, form.confirmPassword);
    } else {
      await auth.login(email, form.password);
    }
    // redirect 仅接受以 / 开头的内部路径，其余回落首页，防开放跳转
    const raw = route.query.redirect;
    const target =
      typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
    await router.replace(target);
  } catch (err) {
    summary.value = mapError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.auth-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--page);
}
.auth-card {
  width: 380px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--r-card);
  padding: 28px;
}
.mode-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}
.tab {
  border: none;
  background: transparent;
  color: var(--ink-3);
  padding: 6px 14px;
  border-radius: var(--r-pill);
  cursor: pointer;
}
.tab.active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}
h2 {
  font-size: 18px;
  margin-bottom: 8px;
}
.tip {
  font-size: 12px;
  color: var(--ink-3);
  margin-bottom: 12px;
}
.summary {
  background: var(--down-bg);
  color: var(--down);
  font-size: 12.5px;
  border-radius: var(--r-ctrl);
  padding: 8px 12px;
  margin-bottom: 12px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.label {
  font-size: 12.5px;
  color: var(--ink-2);
}
.field input {
  border: 1px solid var(--border-strong);
  border-radius: var(--r-ctrl);
  padding: 9px 12px;
  font-size: 14px;
  background: var(--bg);
  color: var(--ink-1);
}
.field input:focus {
  outline: 1px solid var(--accent);
}
.field-error {
  font-size: 12px;
  color: var(--down);
}
.submit {
  margin-top: 6px;
  border: none;
  background: var(--accent);
  color: var(--on-accent);
  border-radius: var(--r-pill);
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
}
.submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
