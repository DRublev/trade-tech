<template>
  <div class="onboarding mt-24">
    <h1 class="mb-8 text-5xl">Trade.Tech</h1>
    <ChooseMode v-if="!isModeChosen" :chooseMode="chooseMode"/>
    <EnterSandboxToken v-if="isModeChosen" :done="onSandboxTokenEntered"/>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

import { OnboardingUseCase } from '@/useCases';

import ChooseMode from '@/components/onboarding/ChooseMode.vue';
import EnterSandboxToken from '@/components/onboarding/EnterSandboxToken.vue';


@Options({
  components: { 
    ChooseMode,
    EnterSandboxToken,
  },
})
export default class Onboarding extends Vue {
  private onboardingUC = new OnboardingUseCase();

  get isModeChosen() {
    return !!this.onboardingUC.Mode;
  }

  chooseMode(isSandbox: boolean) {
    this.onboardingUC.setMode(isSandbox);
  }

  onSandboxTokenEntered(token: string) {
    this.onboardingUC.setSandboxToken(token);
  }
}
</script>
<style scoped>
h3 {
  margin: 40px 0 0;
}
</style>
