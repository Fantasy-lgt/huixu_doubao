import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './styles/tokens.css';

// TODO(W2): Element Plus 按需引入与紫主题覆盖（排期推荐组件库）：
// import ElementPlus from 'element-plus';
// import 'element-plus/dist/index.css';
// app.use(ElementPlus);

createApp(App).use(router).mount('#app');
