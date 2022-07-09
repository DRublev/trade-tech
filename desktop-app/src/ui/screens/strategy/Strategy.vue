<template>
  <main class="h-full">
    <div class="content mt-4">
      <div class="w-full pb-2 pt-4 justify-center topbar">
        <div class="w-1/3 flex-1 mx-8">
          <h2 class="text-left text-xl">{{ config.strategy }}</h2>
        </div>
        <div class="w-1/3 mx-auto flex-1 flex flex-row justify-evenly">
          <div>
            <button @click="switchWorking" class="border rounded px-4 py-1 align-center align-middle text-center"
              :class="{ 'bg-red-600 text-white': status.working }"
              style="height: 30px">
              <fa v-if="!status.loading" :icon="['fas', status.working ? 'pause' : 'play']"
                class="text-l align-baseline" />
              <Loader v-if="status.loading" class="max-h-full" />
            </button>
            <p class="mb-0 text-sm text-center">
              <span v-if="!status.working">Start</span>
              <span v-else>Stop</span>
            </p>
          </div>
        </div>
        <div class="w-1/3 flex-1"></div>

      </div>
      <div class="min-h-1/2 mx-4 mb-3 mt-3 chart-container" ref="chartContainer">
        <chart ref="chartComponent" :width="chartWidth" :height="chartHeight" />
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
    <aside v-if="!!shownSection" class="sidebar transition">
      <edit-config v-if="shownSection === 'config'" :config="config" v-on:save="controlUC.changeConfig" />
    </aside>
    <aside class="toolbar pt-4">
      <ul class="flex flex-col controls-list mt-5">
        <li>
          <button @click="shownSection = !shownSection ? 'config' : ''"
            class="rounded px-4 py-1 align-center align-middle text-center">
            <fa :icon="['far', 'edit']" class="text-l align-baseline" />
          </button>
        </li>
      </ul>
    </aside>
  </main>

</template>
<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Inject, Watch } from 'vue-property-decorator';

import { DealsListUseCase, StrategyChartUseCase, StrategyControlUseCase } from '@/ui/useCases/strategy';
import { Deal } from '@ui/useCases/strategy/DealsList';
import Chart from '../../components/Chart';
import Loader from '../../components/Loader.vue';
import EditConfig from '../../components/EditConfig.vue';


@Options({
  components: {
    Chart,
    Loader,
    EditConfig,
  }
})
export default class Strategy extends Vue {
  @Inject('mixpanel') readonly mixpanel!: any;
  controlUC = new StrategyControlUseCase();
  chartUC?: StrategyChartUseCase = undefined;
  dealsListUC?: DealsListUseCase = undefined;

  chartWidth = 200;
  chartHeight = 200;

  showModal = false;
  shownSection = '';

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
    window.addEventListener('resize', this.updateChartSize(this.$refs.chartContainer));
    this.updateChartSize(this.$refs.chartContainer)();
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
    ]);

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

  @Watch('shownSection')
  onShownSectionChange() {
    console.log('160 Strategy', );
    this.updateChartSize(this.$refs.chartContainer)();
  }

  get config() { return this.controlUC.Config; }
  get status() { return this.controlUC.Status; }
  get deals() { return this.dealsListUC?.Deals || []; }
  get pendingDeals() { return this.dealsListUC?.PendingDeals || []; }
  get logs() { return this.dealsListUC?.Logs || []; }
}
</script>
<style scoped>
main {
  background-color: #f6f6f6;
  display: flex;
  justify-content: space-between;
  max-width: 100%;
}

.topbar {
  height: 75px;
  display: flex;
  flex-direction: row;
}

.topbar h2 {
  font-size: xx-large;
}

.controls-list li {
  text-align: center;
}

.chart-container {
  border: 1px solid rgb(30 41 59);
  border-radius: 25px;
  max-width: 100vw;
}

.content {
  border-radius: 25px;
  margin-left: 1.25rem;
  flex: 1 1 auto;
  background-color: #fff;
}

.sidebar {
  position: fixed;
  top: 0;
  right: 60px;
  height: 100vh;
  width: auto;
  max-width: 25vw;
  padding-top: 105px;
  background-color: #fff;
}

.toolbar {
  width: 60px;
  height: 100%;
}
</style>