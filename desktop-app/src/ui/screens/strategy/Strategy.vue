<template>
  <main class="h-full">
    <div class="content mt-4">
      <div class="w-100 pb-2 pt-4 justify-center topbar">
        <div class="w-1/3 flex-1"></div>
        <div class="w-1/3 mx-auto flex-1 flex flex-row justify-evenly">
          <div>
            <button @click="switchWorking" class="border rounded px-4 py-1 align-center align-middle text-center"
              :class="{ 'bg-red-400 text-white': status.working, 'bg-indigo-400 text-white': !status.working }"
              style="height: 30px">
              <fa v-if="!status.loading" :icon="['fas', status.working ? 'pause' : 'play']"
                class="text-l align-baseline" />
              <Loader v-if="status.loading" class="max-h-full" />
            </button>
            <p class="mb-0 text-sm">
              <span v-if="!status.working">Start</span>
              <span v-else>Stop</span>
            </p>
          </div>
        </div>
        <div class="w-1/3 flex-1"></div>
  
      </div>
      <div class="max-w-full min-h-1/2 mx-4 mb-3 chart-container" ref="chartContainer">
        <chart ref="chartComponent" :width="chartWidth" :height="chartHeight" :title="chartTitle" />
      </div>
      <div class="w-full mx-3">
        <div class="flex justify-between">
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
    </div>
    <aside class="sidebar">
      <ul class="flex flex-col controls-list">
        <li>
          <button @click="openConfigModal" class="rounded px-4 py-1 align-center align-middle text-center">
            <fa :icon="['far', 'edit']" class="text-l align-baseline" />
          </button>
        </li>
      </ul>
    </aside>
    <Modal v-model="showModal" :close="closeConfigModal">
    hello world!
    </Modal>
  </main>
  
</template>
<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Inject } from 'vue-property-decorator';

import { DealsListUseCase, StrategyChartUseCase, StrategyControlUseCase } from '@/ui/useCases/strategy';
import { Deal } from '@ui/useCases/strategy/DealsList';
import Chart from '../../components/Chart';
import Loader from '../../components/Loader.vue';


@Options({
  components: {
    Chart,
    Loader,
  }
})
export default class Strategy extends Vue {
  @Inject('mixpanel') readonly mixpanel!: any;
  controlUC = new StrategyControlUseCase();
  chartUC?: StrategyChartUseCase = undefined;
  dealsListUC?: DealsListUseCase = undefined;

  logs: string[] = [];
  chartWidth = 200;
  chartHeight = 200;

  showModal = false;

  declare $refs: {
    chartContainer: HTMLFormElement,
    chartComponent: HTMLFormElement,
  }

  mounted() {
    this.chartUC = new StrategyChartUseCase(this.controlUC.Config.figi, this.onCandle.bind(this));
    this.chartUC.subscribeOnCandles();
    this.mixpanel.identify();

    this.dealsListUC = new DealsListUseCase(this.onDeal.bind(this));

    this.updateChartSize = this.updateChartSize.bind(this);
    window.addEventListener('resize', this.updateChartSize(this.$refs.chartContainer))
    this.updateChartSize(this.$refs.chartContainer)()
  }
  beforeDestroy() {
    window.removeEventListener('resize', this.updateChartSize(this.$refs.chartContainer));
  }

  switchWorking() {
    this.controlUC.Working = !this.status.working;
  }

  updateChartSize = (container: HTMLFormElement) => () => {
    this.chartWidth = container.clientWidth;
    this.chartHeight = container.clientHeight;
  }

  onCandle() {
    this.$refs.chartComponent.updateChart(this.chartUC?.Data);
  }

  onDeal(latestDeal?: Deal, isPending: boolean = false) {
    const mapDeal = (d: Deal) => ([
      d.time,
      d.action === 'buy' ? 1 : 0,
      d.pricePerLot,
      `${d.pricePerLot}`,
    ])
    console.log('109 Strategy', 'dealchange', latestDeal, isPending);
     const deals = this.dealsListUC?.Deals.filter(d => !d.isClosed).map(mapDeal);
    const pendingDeals = this.dealsListUC?.PendingDeals.filter(d => !d.isClosed).map(mapDeal);
    if (latestDeal && !isPending) {
      this.mixpanel.track('deal', {
        action: latestDeal.action,
        price: latestDeal.pricePerLot,
        lots: latestDeal.lots,
        sum: latestDeal.sum,
      });
      this.mixpanel.people.increment('turnover', !latestDeal.isClosed ? latestDeal.sum : latestDeal.sum * -1);
      // this.mixpanel.people.increment('turnover_usd', !latestDeal.isClosed ? latestDeal.sum : latestDeal.sum * -1);
    }
    this.$refs.chartComponent.updateTrades(deals, pendingDeals);
  }

  openConfigModal() {
    this.showModal = true;
  }
  closeConfigModal() {
    this.showModal = false;
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
  get pendingDeals() {
    return this.dealsListUC?.PendingDeals || [];
  }
  get Logs() {
    return this.dealsListUC?.Logs || [];
  }
}
</script>
<style scoped>
main {
  background-color: #f6f6f6;
}

.topbar {
  height: 75px;
}
.controls-list {
  margin-top: 105px; 
}

.chart-container {
  background-color: #f6f6f6;
  border-radius: 25px;
}

.content {
  border-radius: 25px;
  margin-left: 1.25rem;
  width: calc(100% - 60px - 1.25rem);
  height: calc(100% - 75px);
  float: left;
  background-color: #fff;
}

.sidebar {
  width: 60px;
  height: 100%;
  float: right;
  height: calc(100% - 75px);
}
</style>