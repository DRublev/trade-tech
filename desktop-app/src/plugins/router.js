import { createWebHistory, createRouter } from "vue-router";
import Store from "@/node/domain/Store"
import Welcome from "@/ui/screens/Welcome.vue";
import ChooseMode from "@/ui/components/onboarding/ChooseMode.vue"
import EnterTokens from "@/ui/components/onboarding/EnterTokens.vue"
import ChooseAccount from "@/ui/components/onboarding/ChooseAccount.vue"
import OverviewInfo from "@/ui/components/onboarding/OverviewInfo.vue"


import Strategy from "@/ui/screens/strategy/Strategy.vue";
import DebuggingStrategy from "@/ui/screens/strategy/DebuggingStrategy.vue"


const routes = [
  {
    path: "/onboarding",
    name: "Welcome",
    component: Welcome,
    children: [
      {
        path: '',
        name: "ChooseMode",
        component: ChooseMode,
      },
      {
        path: 'tokens',
        name: "EnterTokens",
        component: EnterTokens,
      },
      {
        path: 'accounts',
        name: "ChooseAccount",
        component: ChooseAccount,
      },
      {
        path: 'overview',
        name: "OverviewInfo",
        component: OverviewInfo,
      },
    ]
  },
  {
    path: "/",
    name: "Strategy",
    component: Strategy,
  },
  {
    path: "/debug-strategy",
    name: "Debug",
    component: DebuggingStrategy,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// eslint-disable-next-line 
router.beforeEach(async (to, from, next) => {
  if ((!Store.HasToken || !Store.HasAccountChosen) &&
    to.path === '/'
  ) {
    next( { path: '/onboarding'})
  } else if(!Store.HasToken && to.path === '/onboarding/accounts'){
    next( { path: '/onboarding/tokens'})
  } else if (!Store.HasAccountChosen && to.path === '/onboarding/overview'){
    next( { path: '/onboarding/accounts'})
  } else {
    next()
  }
})

export default router;