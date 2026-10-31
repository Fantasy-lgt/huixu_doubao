import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

// 路由表对照《IA站点地图-路由与数据对照表.md》第 2 节；编辑器五步为内部 step 状态机，不拆 URL
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'auth',
    component: () => import('@/views/AuthView.vue'),
    meta: { public: true, title: '登录 / 注册' },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: '工作台' } },
      { path: 'materials', name: 'materials', component: () => import('@/views/MatView.vue'), meta: { title: '材料库' } },
      { path: 'editor/:draftId?', name: 'editor', component: () => import('@/views/EditorView.vue'), meta: { title: '草稿编辑' } },
      { path: 'templates', name: 'templates', component: () => import('@/views/TplView.vue'), meta: { title: '模板库' } },
      { path: 'year', name: 'year', component: () => import('@/views/YearView.vue'), meta: { title: '年度回顾' } },
      { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue'), meta: { title: '设置 / 模型 Key' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 守卫占位（W2 接真实会话）：
// 1. requiresAuth 路由先 GET /me；401 → 跳 /login?redirect=原path
// 2. 已登录访问 /login → 跳 /
// 当前无后端阶段不强制拦截，保证骨架可直接预览各视图。
router.beforeEach((to) => {
  document.title = `${(to.meta.title as string) ?? ''} · 汇序 Pro`;
  // TODO(W2): const me = await api.getMe(); if (to.meta.requiresAuth && !me) return { path:'/login', query:{redirect:to.fullPath} }
  return true;
});

export default router;
