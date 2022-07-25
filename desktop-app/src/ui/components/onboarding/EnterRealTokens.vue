<template>
  <div class="flex flex-col items-center justify-center">
    <h3 class="text-2xl mb-1">Нам нужны токены, чтобы продолжить работу</h3>
    <p>
      Не волнуйтесь, они хранится локально внутри приложения и никуда не
      отсылаются
    </p>
    <div class="mt-8 space-x-8 px-12 flex">
      <input
        :value="enteredReadOnlyToken"
        type="password"
        @input="enterReadOnlyToken($event)"
        placeholder="Read-only токен"
        class="px-2 w-56 border rounded-full"
      />
      <input
        :value="enteredFullAccessToken"
        type="password"
        @input="enterFullAccessToken($event)"
        placeholder="Full access токен"
        class="p-2 w-56 border rounded-full"
      />
      <button
        @click="enterTokens"
        class="border rounded-full font-medium px-6 py-2 transition hover:bg-purple-600 hover:text-white flex"
      >
        Далее
      </button>
    </div>
    <div class="mt-2">
      <a href="https://google.com" class="text-teal-600"
        >Где я могу их взять?</a
      >
    </div>
  </div>
</template>
<script lang="ts">
import { Vue } from "vue-class-component";
import { Emit } from "vue-property-decorator";

export default class EnterRealTokens extends Vue {
  enteredReadOnlyToken: string = "";
  enteredFullAccessToken: string = "";

  @Emit("enterTokens")
  enterTokens() {
    return {
      readOnlyToken: this.enteredReadOnlyToken,
      fullAccessToken: this.enteredFullAccessToken,
      isSandbox: false,
    };
  }

  enterReadOnlyToken($event: { target: { value: string } }) {
    this.enteredReadOnlyToken = $event.target.value;
  }
  enterFullAccessToken($event: { target: { value: string } }) {
    this.enteredFullAccessToken = $event.target.value;
  }
}
</script>
