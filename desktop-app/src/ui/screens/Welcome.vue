<template class="text-center">
  <Header v-if="!showOnboarding" />

  <Onboarding v-if="showOnboarding" />

  <Strategy v-if="!showOnboarding && !showDebug" />
  <DebuggingStrategy v-if="!showOnboarding && showDebug" />
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

import Store from '@/node/domain/Store';
import Onboarding from './onboarding/index.vue';
import DebuggingStrategy from './strategy/DebuggingStrategy.vue';
import Strategy from './strategy/Strategy.vue';
import Header from '@/ui/components/Header.vue';


@Options({
  components: {
    Onboarding,
    Strategy,
    DebuggingStrategy,
    Header,
  },
})
export default class Welcome extends Vue {
  showDebug = false;
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
