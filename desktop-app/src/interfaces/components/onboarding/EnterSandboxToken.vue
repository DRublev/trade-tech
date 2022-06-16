<template>
  <h3 class="text-2xl mb-1 mt-24">Нам нужен Sandbox токен, чтобы продолжить работу</h3>
  <p>Не волнуйтесь, он хранится локально внутри приложения и никуда не отсылается</p>
  <div class="mt-8 space-x-8 px-12">
    <input :value="enteredToken" type="password" @input="enterToken($event)" placeholder="Sandbox токен" class="p-2 w-56 border rounded-full" />
    <button @click="done(enteredToken)" class="border border-purple-600 text-purple-600 rounded-full font-medium px-6 py-2">Далее</button>
  </div>
  <div class="mt-2">
    <a href="https://google.com" class="text-teal-600">Где я могу его взять?</a>
  </div>
</template>
<script lang="ts">
import { Options, Vue } from 'vue-class-component';

@Options({
  props: {
    done: {
      type: Function,
      required: true,
    },
  }
})
export default class EnterSandboxToken extends Vue {
  enteredToken: string = '';

  enterToken($event: { target: { value: string } }) {
    this.enteredToken = $event.target.value;
  }
}
</script>