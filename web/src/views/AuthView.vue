<template>
  <div class="auth-wrap">
    <div class="auth-card">
      <h2>登录 / 注册（占位）</h2>
      <p class="tip">路由 /login · meta.public · W2 接 POST /auth/login、POST /auth/register</p>
      <ul>
        <li>邮箱 + 密码；注册含确认密码即时比对；失败三级反馈（汇总条 / 字段红边 / 字段红字）</li>
        <li>登录成功种 HttpOnly Cookie Session，跳 / 或 ?redirect= 原地址</li>
        <li>不做第三方登录、不做邮件自助找回（本期边界）</li>
      </ul>
      <RouterLink class="enter" to="/">进入主壳预览 →</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

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
h2 {
  font-size: 18px;
  margin-bottom: 8px;
}
.tip {
  font-size: 12px;
  color: var(--ink-3);
  margin-bottom: 12px;
}
ul {
  padding-left: 18px;
  font-size: 12.5px;
  color: var(--ink-2);
  line-height: 1.9;
  margin-bottom: 16px;
}
.enter {
  display: inline-block;
  background: var(--accent);
  color: var(--on-accent);
  padding: 8px 16px;
  border-radius: var(--r-pill);
  font-size: 13px;
}
</style>
