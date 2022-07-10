<template>
  <div class="onboarding pt-24 text-center">
    <h1 class="mb-8 text-5xl">Trade.Tech</h1>
    <ChooseMode v-if="!isModeChosen" :chooseMode="chooseMode" />
    <EnterSandboxToken v-if="isModeChosen && isSandbox && !IsTokenEntered" :done="onSandboxTokenEntered" />
    <EnterRealTokens v-if="isModeChosen && !isSandbox && !IsTokenEntered" :done="onRealTokensEntered" />
    <ChooseAccount v-if="IsTokenEntered && !IsAccountChosen" :accountOptions="accountOptions" :done="onChooseAccount"
      :isLoading="isAccountsListLoading" />
  </div>
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';

import { OnboardingUseCase } from '@/ui/useCases';

import ChooseMode from '@/ui/components/onboarding/ChooseMode.vue';
import EnterSandboxToken from '@/ui/components/onboarding/EnterSandboxToken.vue';
import EnterRealTokens from '@/ui/components/onboarding/EnterRealTokens.vue';
import ChooseAccount from '@/ui/components/onboarding/ChooseAccount.vue';


@Options({
  components: {
    ChooseMode,
    EnterSandboxToken,
    EnterRealTokens,
    ChooseAccount,
  },
})
export default class Onboarding extends Vue {
  private onboardingUC = new OnboardingUseCase();
  isAccountsListLoading = false;

  mounted() {
    if (this.isModeChosen && this.IsTokenEntered) {
      this.fetchAccountsList();
    }
  }

  get isModeChosen() {
    return this.onboardingUC.Mode !== undefined;
  }

  get isSandbox() {
    return this.onboardingUC.Mode === 'sandbox';
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
  async onRealTokensEntered(readOnly: string, fullAccess: string) {
    await this.onboardingUC.setRealTokens(readOnly, fullAccess);
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
