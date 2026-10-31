<template>
  <div class="layout">
    <aside class="side">
      <div class="brand">
        <span class="mark">汇</span>
        <span class="brand-name">汇序 Pro</span>
      </div>
      <nav class="nav">
        <RouterLink v-for="item in navItems" :key="item.path" :to="item.path" class="nav-link">
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="side-foot">本地规则模式 · 未配置 Key</div>
    </aside>
    <section class="main">
      <header class="topbar">
        <h2 class="page-title">{{ currentTitle }}</h2>
        <button class="ghost-btn" type="button">问助手（抽屉，W5 接入）</button>
      </header>
      <div class="content">
        <RouterView />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// 导航与 IA 对照表一致；AI 助手为全局抽屉，不占路由
const navItems = [
  { label: '工作台', path: '/' },
  { label: '材料库', path: '/materials' },
  { label: '草稿编辑', path: '/editor' },
  { label: '模板库', path: '/templates' },
  { label: '年度回顾', path: '/year' },
  { label: '设置', path: '/settings' },
];

const route = useRoute();
const currentTitle = computed(() => (route.meta.title as string) ?? '工作台');
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}
.side {
  width: var(--side);
  background: var(--bg);
  border-right: 1px solid var(--border);
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px 18px;
}
.mark {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--accent-2), var(--accent));
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.brand-name {
  font-weight: 700;
  color: var(--ink-1);
}
.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.nav-link {
  padding: 9px 12px;
  border-radius: var(--r-ctrl);
  color: var(--ink-2);
}
.nav-link.router-link-active {
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}
.side-foot {
  margin-top: auto;
  font-size: 11px;
  color: var(--ink-3);
  padding: 10px;
  border-top: 1px solid var(--border);
}
.main {
  flex: 1;
  padding: 18px 24px;
  min-width: 0;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
}
.ghost-btn {
  border: 1px solid var(--border-strong);
  background: var(--bg);
  color: var(--ink-2);
  border-radius: var(--r-pill);
  padding: 7px 14px;
  cursor: pointer;
}
.content {
  margin-top: 16px;
}
</style>
