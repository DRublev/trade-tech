<template>
<div class="flex flex-row">
  <div v-for="currency in currencies" :key="currency.code" class="mr-7">
    <span class="h-3 w-3 bg-slate-800 text-white px-2 py-1 mr-1 rounded-xl">{{ currency.symbol }}</span>
    <h6 class="mr-2 inline text-slate-800 ">{{ currency.code }}</h6>
    <span class="text-xl">{{ currency.amount }}</span>
  </div>
</div>
</template>
<script lang="ts">
import { Vue } from 'vue-class-component';
import ActivesUseCase from '@/ui/useCases/Actives';
import { BalanceEntity } from '@/ui/useCases/MoneyDTO';


export default class UserActives extends Vue {
  currencies: BalanceEntity[] = [];
  activesUC = ActivesUseCase;

  mounted() {
    this.activesUC.subscribe(this.onBalancesChanged.bind(this));
    this.activesUC.fetchBalances();
  }

  onBalancesChanged(balances: any) {
    this.currencies = Object.values(balances);
  }
}
</script>