<template>
  <Onboarding v-if="showOnboarding" />
  <div class="welcome" v-else>
    <h1>Trade.Tech</h1>
    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-purple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

import Store from '@/domain/Store';
import Onboarding from '@/app/components/screens/onboarding/index.vue';


@Options({
  props: { },
  components: { 
    Onboarding,
  },
})
export default class Welcome extends Vue {
  data() {
    return {
      showOnboarding: !Store.HasToken,
    }
  }
}
</script>
<style scoped>
h3 {
  margin: 40px 0 0;
}
</style>
