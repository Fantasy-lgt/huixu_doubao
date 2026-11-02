import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

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

// 守卫：requiresAuth 路由首次进入先 GET /me；未登录带 redirect 跳 /login；
// 已登录访问 /login 直接回工作台；document.title 逻辑保留。
router.beforeEach(async (to) => {
  document.title = `${(to.meta.title as string) ?? ''} · 汇序 Pro`;
  const auth = useAuthStore();
  if (to.meta.requiresAuth) {
    if (!auth.initialized) await auth.fetchMe();
    if (!auth.isLoggedIn) {
      return {
        path: '/login',
        query: to.fullPath && to.fullPath !== '/' ? { redirect: to.fullPath } : {},
      };
    }
  }
  if (to.path === '/login' && auth.isLoggedIn) return { path: '/' };
  return true;
});

export default router;
