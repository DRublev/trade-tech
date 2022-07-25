<template>
  <div v-if="!isLoading">
    <div
      v-if="accountOptions && accountOptions.length"
      class="flex flex-col items-center"
    >
      <h3 class="text-2xl mb-1 text-center">
        Нашли несколько активных аккаунтов, какой нужный?
      </h3>

      <p class="mt-6 mb-4">Список аккаунтов:</p>
      <ul>
        <li v-for="account in accountOptions" :key="account.id">
          <div class="flex items-center mb-4">
            <input
              :id="account.id"
              type="radio"
              v-model="accountId"
              value="account.id"
              name="default-radio"
              class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label :for="account.id" class="ml-2 text-sm font-medium">{{
              account.name || account.id
            }}</label>
          </div>
        </li>
      </ul>
      <div class="mt-8 space-x-8 px-12">
        <button
          @click="chooseAccount()"
          class="border rounded-full font-medium px-6 py-2 transition hover:bg-purple-600 hover:text-white flex"
        >
          Далее
        </button>
      </div>
    </div>
    <div v-else class="flex flex-col items-center">
      <span class="mb-3"
        >К сожалению, не нашли ни одного аккаунта. Можно создать новый</span
      >
      <button
        class="bg-purple-100 rounded-full font-medium px-6 py-2 text-white flex"
        :disabled="true"
      >
        Создать новый аккаунт
      </button>
      <p class="text-xs text-gray-400 mb-3">
        Создание нового аккаунта пока недоступно
      </p>

      <span class="mb-3"
        >Или вернуться на прошлый шаг и попопробовать другие ключи</span
      >
      <router-link
        to="/onboarding/tokens"
        class="border border-purple-600 text-purple-600 rounded-full font-medium px-6 py-2 hover:bg-purple-600 hover:text-white"
      >
        Вернуться
      </router-link>
    </div>
  </div>
  <div v-else>
    <svg
      class="animate-spin -ml-1 mr-3 h-5 w-5 text-purple"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div>
</template>
<script lang="ts">
import { Vue } from "vue-class-component";
import { Prop, Emit } from "vue-property-decorator";

export default class ChooseAccount extends Vue {
  @Prop() accountOptions!: any[];
  @Prop() isLoading!: boolean;
  @Emit("chooseAccount")
  chooseAccount() {
    return this.accountId;
  }

  accountId: string = "";
}
</script>
