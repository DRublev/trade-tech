<template>
  <div class="onboarding mt-24">
    <h1 class="mb-8 text-5xl">Trade.Tech</h1>
    <ChooseMode v-if="!isModeChosen" :chooseMode="chooseMode"/>
    <EnterSandboxToken v-if="isModeChosen" :done="onSandboxTokenEntered"/>
    <ChooseAccount v-if="isModeChosen && !IsAccountChosen" :accountOptions="accountOptions" :done="onChooseAccount"/>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

import { OnboardingUseCase } from '@/app/useCases';

import ChooseMode from '@/app/components/onboarding/ChooseMode.vue';
import EnterSandboxToken from '@/app/components/onboarding/EnterSandboxToken.vue';
import ChooseAccount from '@/app/components/onboarding/ChooseAccount.vue';


@Options({
  components: { 
    ChooseMode,
    EnterSandboxToken,
    ChooseAccount,
  },
})
export default class Onboarding extends Vue {
  private onboardingUC = new OnboardingUseCase();

  get isModeChosen() {
    return !!this.onboardingUC.Mode;
  }

  get IsAccountChosen() {
    return !!this.onboardingUC.Account;
  }

  get accountOptions() {
    return this.onboardingUC.AccountsList;
  }

  chooseMode(isSandbox: boolean) {
    this.onboardingUC.setMode(isSandbox);
  }

  onSandboxTokenEntered(token: string) {
    this.onboardingUC.setSandboxToken(token);
  }

  onChooseAccount(account: any) {
    this.onboardingUC.Account = account;
  }
}
</script>
<style scoped>
h3 {
  margin: 40px 0 0;
}
</style>
