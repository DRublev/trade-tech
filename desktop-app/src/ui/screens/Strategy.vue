<template>
  <div class="min-w-full min-h-1/2">
    <chart />
    <!-- <chart :chartData="chartData" :markers="chartMarkers" v-on:visibleAreaChanged="onChartVisibleAreaChanged($event)" /> -->
  </div>
  <div class="w-full mx-3 h-1/2">
    <div class="flex justify-between h-full divide-x">
      <div class="flex-1 place-items-center pt-2 overflow-x-hidden overflow-y-scroll">
        <ul class="text-left ml-16">
          <li v-for="log in logs" :key="log">{{ log }}</li>
        </ul>
      </div>
      <div class="flex-1 place-items-center pt-2 px-8">
        <button @click="switchWorking" class="align-center text-purple text-center" style="height: 30px">
          <fa v-if="!status.loading" :icon="['fas', status.working ? 'pause' : 'play']"
            class="text-3xl stroke-current mb-2" />
          <p v-if="!status.working">Пуск</p>
          <p v-else>Стоп</p>
          <Loader v-if="status.loading" class="max-h-full" />
        </button>
      </div>
      <div class="flex-1 place-items-center pt-2 px-8">
        <h1 class="mb-12 text-left">
          <span class="text-gray-500">Стратегия: </span>
          <span class="text-xl">{{ strategyInfo.name }}</span>
        </h1>
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
import { DealsListUseCase, StrategyChartUseCase, StrategyControlUseCase } from '@/ui/useCases/strategy';
import { Options, Vue } from 'vue-class-component';
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
  chartUC = new StrategyChartUseCase(this.controlUC.Config.figi);
  dealsListUC = new DealsListUseCase();

  switchWorking() {
    this.controlUC.Working = !this.status.working;
  }

  // eslint-disable-next-line no-unused-vars
  onChartVisibleAreaChanged(range: any) {
    // console.log('42 Strategy', range);
  }

  get status() {
    return this.controlUC.Status;
  }
  get strategyInfo() {
    const name = this.controlUC.Config.strategy;
    return { name };
  }
  get chartData() {
    return this.chartUC.Data;
  }
  get chartMarkers() {
    return this.chartUC.Markers;
  }
  get deals() {
    return this.dealsListUC.Deals;
  }
  get logs() {
    return this.dealsListUC.Logs;
  }
}
</script>