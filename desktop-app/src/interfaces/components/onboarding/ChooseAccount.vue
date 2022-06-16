<template>
  <div v-if="!isLoading">
    <h3 class="text-2xl mb-1 mt-24">Нашли несколько активных аккаунтов, какой нужный?</h3>
    <p>Можно будет поменять в любой момент</p>

    <p class="mt-6">Вот список:</p>
<ul>
  <li v-for="account in accountOptions" :key="account.id">
    <input type="radio" :id="account.id" :value="account.id" v-model="accountId"/>
    <label for="{{account.id}}">{{account.name || account.id}}</label>
  </li>
</ul>
    <div class="mt-8 space-x-8 px-12">
      <button @click="next()"
        class="border border-purple-600 text-purple-600 rounded-full font-medium px-6 py-2">Далее</button>
    </div>
  </div>
  <div v-else>
    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-purple" xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
      </path>
    </svg>
  </div>
</template>
<script lang="ts">
import { Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';


export default class ChooseAccount extends Vue {
  @Prop() accountOptions!: any[];
  @Prop() isLoading!: boolean;
  @Prop() done!: Function;

  accountId: string = '';

  next() {
    this.done(this.accountId);
  }
}
</script>