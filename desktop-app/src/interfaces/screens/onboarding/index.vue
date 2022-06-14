<template>
  <div class="onboarding mt-24">
    <h1 class="mb-8 text-5xl">Trade.Tech</h1>
    <ChooseMode v-if="!isModeChosen" :chooseMode="chooseMode" />
    <EnterSandboxToken v-if="isModeChosen && !IsTokenEntered" :done="onSandboxTokenEntered" />
    <ChooseAccount v-if="IsTokenEntered && !IsAccountChosen" :accountOptions="accountOptions" :done="onChooseAccount"
      :isLoading="isAccountsListLoading" />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

import { OnboardingUseCase } from '@/interfaces/useCases';

import ChooseMode from '@/interfaces/components/onboarding/ChooseMode.vue';
import EnterSandboxToken from '@/interfaces/components/onboarding/EnterSandboxToken.vue';
import ChooseAccount from '@/interfaces/components/onboarding/ChooseAccount.vue';


@Options({
  components: {
    ChooseMode,
    EnterSandboxToken,
    ChooseAccount,
  },
})
export default class Onboarding extends Vue {
  private onboardingUC = new OnboardingUseCase();
  isAccountsListLoading = false;

  mounted() {
    this.fetchAccountsList();
  }

  get isModeChosen() {
    return this.onboardingUC.Mode !== undefined;
  }

  get IsAccountChosen() {
    return !!this.onboardingUC.Account;
  }
  get IsTokenEntered() {
    return this.onboardingUC.HasToken;
  }

  get accountOptions() {
    return this.onboardingUC.AccountsList;
  }

  chooseMode(isSandbox: boolean) {
    this.onboardingUC.setMode(isSandbox);
  }

  async onSandboxTokenEntered(token: string) {
    await this.onboardingUC.setSandboxToken(token);
    await this.onboardingUC.buildSdk();
    this.fetchAccountsList();
  }

  onChooseAccount(account: any) {
    this.onboardingUC.Account = account;
  }

  private async fetchAccountsList() {
    try {
      this.isAccountsListLoading = true;
      await this.onboardingUC.fetchAccounts();
    } catch (e) {
      console.error(e);
    } finally {
      this.isAccountsListLoading = false;
    }
  }
}
</script>
<style scoped>
h3 {
  margin: 40px 0 0;
}
</style>
