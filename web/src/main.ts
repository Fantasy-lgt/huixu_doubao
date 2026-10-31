import { createApp } from 'vue';
import { createPinia } from 'pinia';
import TDesign from 'tdesign-vue-next';
import App from './App.vue';
import router from './router';
import 'tdesign-vue-next/es/style/index.css';
import './styles/tokens.css';
import './styles/theme.css';

// 基础装配：Pinia（按业务拆多 store，见 src/stores）+ 路由 + TDesign（紫主题见 theme.css）
const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(TDesign);
app.mount('#app');
