<template>
  <div class="min-w-full min-h-1/2" ref="chartContainer">
    <chart ref="chartComponent" :width="chartWidth" :height="chartHeight" :title="chartTitle" />
  </div>
  <div class="w-full mx-3 h-1/2">
    <div class="flex justify-between h-full divide-x">
      <div class="flex flex-1 place-items-start pt-2 overflow-x-hidden overflow-y-scroll">
        <ul class="text-left ml-16">
          <li v-for="log in logs" :key="log">{{ log }}</li>
        </ul>
      </div>
      <div class="flex flex-1 justify-start pt-2 px-8">
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
import { DealsListUseCase, StrategyChartUseCase, StrategyControlUseCase } from '@/ui/useCases/strategy';
import { Deal } from '@ui/useCases/strategy/DealsList';
import Chart from '../components/Chart';
import Loader from '../components/Loader.vue';


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
  chartWidth = 200;
  chartHeight = 200;

  switchWorking() {
    this.controlUC.Working = !this.status.working;
  }

  declare $refs: {
    chartContainer: HTMLFormElement,
    chartComponent: HTMLFormElement,
  }

  mounted() {
    this.chartUC = new StrategyChartUseCase(this.controlUC.Config.figi, this.onCandle.bind(this));
    this.chartUC.subscribeOnCandles();

    this.dealsListUC = new DealsListUseCase(this.onDeal.bind(this));

    this.updateChartSize = this.updateChartSize.bind(this);
    window.addEventListener('resize', this.updateChartSize(this.$refs.chartContainer))
    this.updateChartSize(this.$refs.chartContainer)()
  }
  beforeDestroy() {
    window.removeEventListener('resize', this.updateChartSize(this.$refs.chartContainer));
  }

  updateChartSize = (container: HTMLFormElement) => () => {
    this.chartWidth = container.clientWidth;
    this.chartHeight = container.clientHeight;
  }

  onCandle() {
    this.$refs.chartComponent.updateChart(this.chartUC?.Data);
  }

  onDeal(latestDeal?: Deal) {
    const deals = this.dealsListUC?.Deals.filter(d => !d.isClosed).map((d) => [
      d.time,
      d.action === 'buy' ? 1 : 0,
      d.pricePerLot,
      `${d.pricePerLot}`,
    ]);
    if (latestDeal) {
      // event('turnover', { turnover: latestDeal.sum });
    }
    this.$refs.chartComponent.updateTrades(deals);
  }

  get chartTitle() {
    const { ticker, strategy } = this.controlUC.Config;
    return `${ticker} ${strategy}`;
  }
  get status() {
    return this.controlUC.Status;
  }
  get deals() {
    return this.dealsListUC?.Deals || [];
  }
  get Logs() {
    return this.dealsListUC?.Logs || [];
  }
}
</script>