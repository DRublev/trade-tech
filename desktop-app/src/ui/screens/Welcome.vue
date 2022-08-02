<template>
  <div class="h-screen w-full flex justify-center items-center">
    <Stepper class="mr-5 w-96 shrink-0" />
    <div class="w-full">
      <router-view v-slot="{ Component }" @chooseMode="chooseMode" @enterTokens="onTokensEntered"
        @chooseAccount="onChooseAccount" :isModeChosen="isModeChosen" :isSandbox="isSandbox"
        :accountOptions="accountOptions" v-cloak>
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { OnboardingUseCase } from "@/ui/logic";

import Onboarding from "./onboarding/index.vue";
import Stepper from "./onboarding/Stepper.vue";

@Options({
  components: {
    Onboarding,
    Stepper,
  },
})
export default class Welcome extends Vue {
  private onboardingUC = new OnboardingUseCase();
  isAccountsListLoading = false;

  mounted() {
    if (this.isModeChosen && this.IsTokenEntered) {
      this.fetchAccountsList();
      this.$router.push("/onboarding/accounts");
    }

    if (this.isModeChosen && !this.IsTokenEntered) {
      this.$router.push("/onboarding/tokens");
    }

    if (this.isModeChosen && this.IsTokenEntered && this.IsAccountChosen) {
      this.$router.push("/onboarding/overview");
    }
  }

  get isModeChosen() {
    return this.onboardingUC.Mode !== undefined;
  }

  get isSandbox() {
    return this.onboardingUC.Mode === "sandbox";
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
    this.$router.push("/onboarding/tokens");
  }

  async onTokensEntered(payload: any) {
    if (payload.sandbox) {
      await this.onSandboxTokenEntered(payload.sandboxToken);
    } else {
      await this.onRealTokensEntered(
        payload.readOnlyToken,
        payload.fullAccessToken
      );
    }
  }

  async onSandboxTokenEntered(token: string) {
    await this.onboardingUC.setSandboxToken(token);
    await this.onboardingUC.buildSdk();
    this.fetchAccountsList();
    this.$router.push("/onboarding/accounts");
  }
  async onRealTokensEntered(readOnly: string, fullAccess: string) {
    await this.onboardingUC.setRealTokens(readOnly, fullAccess);
    await this.onboardingUC.buildSdk();
    await this.fetchAccountsList();
    this.$router.push("/onboarding/accounts");
  }

  onChooseAccount(account: any) {
    this.onboardingUC.Account = account;
    this.$router.push("/onboarding/overview");
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

.fade-enter-active,
.fade-leave-active {
  transition-duration: 0.3s;
  transition-property: opacity;
  transition-timing-function: ease;
}

.fade-enter,
.fade-leave-active {
  opacity: 0;
}
</style>
