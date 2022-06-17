<template>
  <h3 class="text-2xl mb-1 mt-24">Нам нужны токены, чтобы продолжить работу</h3>
  <p>Не волнуйтесь, они хранится локально внутри приложения и никуда не отсылаются</p>
  <div class="mt-8 space-x-8 px-12">
    <input :value="enteredReadOnlyToken" type="password" @input="enterReadOnlyToken($event)" placeholder="Read-only токен" class="p-2 w-56 border rounded-full" />
    <input :value="enteredFullAccessToken" type="password" @input="enterFullAccessToken($event)" placeholder="Full access токен" class="p-2 w-56 border rounded-full" />
    <button @click="done(enteredReadOnlyToken, enteredFullAccessToken)" class="border border-purple-600 text-purple-600 rounded-full font-medium px-6 py-2">Далее</button>
  </div>
  <div class="mt-2">
    <a href="https://google.com" class="text-teal-600">Где я могу их взять?</a>
  </div>
</template>
<script lang="ts">
import { Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';


export default class EnterRealTokens extends Vue {
  @Prop() done!: Function;

  enteredReadOnlyToken: string = '';
  enteredFullAccessToken: string = '';

  enterReadOnlyToken($event: { target: { value: string } }) {
    this.enteredReadOnlyToken = $event.target.value;
  }
  enterFullAccessToken($event: { target: { value: string } }) {
    this.enteredFullAccessToken = $event.target.value;
  }
}
</script>