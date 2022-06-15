<template>
  <Onboarding v-if="showOnboarding" />
  <DebuggingStrategy v-else />
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

import Store from '@/domain/Store';
import Onboarding from './onboarding/index.vue';
import DebuggingStrategy from './DebuggingStrategy.vue';


@Options({
  components: { 
    Onboarding,
    DebuggingStrategy,
  },
})
export default class Welcome extends Vue {
  get showOnboarding() {
    return !Store.HasToken || !Store.HasAccountChosen;
  }
}
</script>
<style scoped>
h3 {
  margin: 40px 0 0;
}
</style>
