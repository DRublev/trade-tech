<template lang="">
  <section class="h-48">
    <div>
      <div class="flex flex-col items-center" id="ProgressStepper">
        <div
          v-for="(step, index) in steps"
          class="w-1/4 flex items-center"
          :key="step"
        >
          <router-link :to="step.url" class="relative mb-2 mr-3">
            <div
              class="w-10 h-10 mx-auto rounded-full text-lg flex items-center"
              :class="
                activeStep >= index
                  ? 'bg-purple-500 text-white'
                  : 'bg-white border-2 border-gray-200'
              "
            >
              <span
                class="text-center text-white w-full"
                :class="activeStep >= index ? 'text-white ' : 'text-gray-600'"
                >{{ index + 1 }}
              </span>
            </div>
          </router-link>

          <div class="text-xs text-center 2xl:text-base">
            {{ step.text }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
import { Vue } from "vue-class-component";

export default class Stepper extends Vue {
  data() {
    return {
      step: 0,
      steps: [
        {
          text: "Режим",
          url: "/onboarding",
        },
        {
          text: "Ключи",
          url: "/onboarding/tokens",
        },
        {
          text: "Аккаунт",
          url: "/onboarding/accounts",
        },
        {
          text: "Всё готово",
          url: "/onboarding/overview",
        },
      ],
    };
  }
  get activeStep() {
    return this.steps.findIndex((step) => step.url === this.$route.fullPath);
  }
}
</script>
<style lang="css"></style>
