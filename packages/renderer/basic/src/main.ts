// src/main.ts
import { createApp } from 'vue'; // 从 vue 导入 createApp
import { createPinia } from 'pinia';
import {createRouter, createWebHashHistory} from 'vue-router';
import  routes  from './router';
import App from './App.vue';
import axios from './util/axios.ts'; // 引入自定义 axios 实例
import '~/styles/index.scss';
import 'uno.css';
//
// // Element Plus styles
// import 'element-plus/theme-chalk/src/message.scss';
// import 'element-plus/theme-chalk/src/message-box.scss';

// 创建 Vue 路由器实例
const router = createRouter({
  history: createWebHashHistory(), // 使用 HTML5 历史模式
  routes, // 使用自动生成的路由
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return false
    }
    return savedPosition || { top: 0 };
  },
});

// 创建 Vue 应用实例
const app = createApp(App);

// 初始化 Pinia
const pinia = createPinia();
app.use(pinia);

// 使用路由器
app.use(router);

// 全局提供 axios
app.provide('axios', axios);

// 安装所有 modules 下的模块
Object.values(import.meta.glob<{ install }>('./modules/*.ts', { eager: true }))
  .forEach(i => i.install?.({ app, router, isClient: true }));

// 挂载应用
app.mount('#app');
