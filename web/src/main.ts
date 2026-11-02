import { createApp } from 'vue';
import { createPinia } from 'pinia';
import TDesign from 'tdesign-vue-next';
import App from './App.vue';
import router from './router';
import { setUnauthorizedHandler } from './api/http';
import { useAuthStore } from './stores/auth';
import 'tdesign-vue-next/es/style/index.css';
import './styles/tokens.css';
import './styles/theme.css';

// 基础装配：Pinia + 路由 + TDesign（紫主题见 theme.css）
const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(TDesign);

// 401 统一清态：http.ts 不直接依赖 router/store，由此处注入处理器；
// 仅业务壳内触发跳转，登录页自身 401 不重复跳转。
setUnauthorizedHandler(() => {
  const auth = useAuthStore();
  auth.clearLocal();
  if (router.currentRoute.value.meta.requiresAuth) {
    router.replace({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath },
    });
  }
});

app.mount('#app');
