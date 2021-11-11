import { createRouter, createWebHashHistory, RouteRecordRaw, } from 'vue-router';
import Index from "./pages/index.vue"
const Console = import("./pages/console.vue")


const routes: RouteRecordRaw[] = [
  { path: '/', name: 'index', component: Index },
  { path: "/console", name: "console", component: Console }
  //{path: '/about', name: 'About', component: () => import('/@/components/About.vue')}, // Lazy load route component
];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
