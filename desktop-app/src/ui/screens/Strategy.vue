<template>
  <div class="w-100 pb-2 pt-4 border-gray-300 border-b justify-center bg-gray-100">
    <div class="flex-1"></div>
    <div class="flex-1">
      <div >
        <button @click="switchWorking"
          class="border border-gray-400 rounded px-4 py-1 align-center align-middle text-center" style="height: 30px">
          <fa v-if="!status.loading" :icon="['fas', status.working ? 'pause' : 'play']" class="text-xl  start-btn-icon" />
          <Loader v-if="status.loading" class="max-h-full" />
        </button>
        <p class="mb-0 text-sm">
          <span v-if="!status.working">Start</span>
          <span v-else>Stop</span>
        </p>
      </div>
    </div>
    <div class="flex-1"></div>

  </div>
  <div class="max-w-full min-h-1/2 my-1" ref="chartContainer">
    <chart ref="chartComponent" :width="chartWidth" :height="chartHeight" :title="chartTitle" />
  </div>
  <div class="w-full mx-3 h-1/2">
    <div class="flex justify-between h-full">
      <div class="flex flex-1 place-items-start pt-2 overflow-x-hidden overflow-y-scroll">
        <ul class="text-left ml-16">
          <li v-for="log in logs" :key="log">{{ log }}</li>
        </ul>
      </div>
      <div class="flex flex-1 justify-start pt-2 px-8">
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
import { Inject } from 'vue-property-decorator';


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
  @Inject('mixpanel') readonly mixpanel!: any;

  mounted() {
    this.chartUC = new StrategyChartUseCase(this.controlUC.Config.figi, this.onCandle.bind(this));
    this.chartUC.subscribeOnCandles();
    this.mixpanel.identify();
    this.mixpanel.track('Check working', { isFine: true });

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
      this.mixpanel.track('deal', {
        action: latestDeal.action,
        price: latestDeal.pricePerLot,
        lots: latestDeal.lots,
        sum: latestDeal.sum,
      });
      this.mixpanel.people.increment('turnover_usd', !latestDeal.isClosed ? latestDeal.sum : latestDeal.sum * -1);
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
<style scoped>
.start-btn-icon {
  /* stroke-width: 10px; */
  /* stroke: #333; */
}
</style>