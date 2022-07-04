<template>
  <div class="min-w-full min-h-1/2">
    <chart ref="chartComponent"/>
  </div>
  <div class="w-full mx-3 h-1/2">
    <div class="flex justify-between h-full divide-x">
      <div class="flex-1 place-items-center pt-2 overflow-x-hidden overflow-y-scroll">
        <ul class="text-left ml-16">
          <li v-for="log in logs" :key="log">{{ log }}</li>
        </ul>
      </div>
      <div class="flex-1 place-items-center pt-2 px-8">
        <h1 class="mb-12 text-left">
          <span class="text-gray-500">Стратегия: </span>
          <span class="text-xl">{{ strategyInfo.name }}</span>
        </h1>
          <button @click="switchWorking" class="align-center text-purple text-center" style="height: 30px">
            <fa v-if="!status.loading" :icon="['fas', status.working ? 'pause' : 'play']"
              class="text-3xl stroke-current mb-2" />
            <p v-if="!status.working">Пуск</p>
            <p v-else>Стоп</p>
            <Loader v-if="status.loading" class="max-h-full" />
          </button>
        <ul>
          <li v-for="d in deals" :key="d.time" class="flex justify-between">
            <span :class="{
              'text-red-500': d.action == 'sell',
              'text-green-500': d.action == 'buy',
              'text-slate-700': d.isClosed,
            }">
              {{ d.action }}
            </span>
            <span>{{ d.pricePerLot }}</span>
            <span>{{ d.lots }}</span>
            <span>{{ d.sum }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { event, customMap } from 'vue-gtag';
import { DealsListUseCase, StrategyChartUseCase, StrategyControlUseCase } from '@/ui/useCases/strategy';
import Chart from '../components/Chart';
import Loader from '../components/Loader.vue';
import { Deal } from '@ui/useCases/strategy/DealsList';


@Options({
  components: {
    Chart,
    Loader,
  }
})
export default class Strategy extends Vue {
  controlUC = new StrategyControlUseCase();
  chartUC?: StrategyChartUseCase = undefined;
  dealsListUC?: DealsListUseCase = undefined;

  logs: string[] = [];

  switchWorking() {
    this.controlUC.Working = !this.status.working;
  }

  mounted() {
    this.chartUC = new StrategyChartUseCase(this.controlUC.Config.figi, this.onCandle.bind(this));
    this.chartUC.subscribeOnCandles();
    customMap({ 'dimension2': 'turnover' });

    this.dealsListUC = new DealsListUseCase(this.onDeal.bind(this));
    this.subscribeOnLogs();
  }

  onCandle() {
    (this.$refs.chartComponent as any).updateChart(this.chartUC?.Data);
  }

  onDeal(latestDeal?: Deal) {
    const deals = this.dealsListUC?.Deals.filter(d => !d.isClosed).map((d) => [
      d.time,
      d.action === 'buy' ? 1 : 0,
      d.pricePerLot,
      `${d.pricePerLot}`,
    ]);
    if (latestDeal) {

      event('turnover', { turnover: latestDeal.sum });
    }
    (this.$refs.chartComponent as any).updateTrades(deals);
  }

  private subscribeOnLogs() {
    (window as any).ipc.on('strategylog', (event: any, chunk: any) => {
        const log = new TextDecoder().decode((chunk));
        console.log('8 DebugStrategy', log);
        this.logs.push(log);
      });
  }

  get status() {
    return this.controlUC.Status;
  }
  get strategyInfo() {
    const name = this.controlUC.Config.strategy;
    return { name };
  }
  get deals() {
    return this.dealsListUC?.Deals || [];
  }
  get Logs() {
    return this.dealsListUC?.Logs || [];
  }
}
</script>