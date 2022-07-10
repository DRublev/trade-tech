import { createWebHistory, createRouter } from "vue-router";
import Welcome from "@/ui/screens/Welcome.vue";


const routes = [
  {
    path: "/",
    name: "Welcome",
    component: Welcome,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;