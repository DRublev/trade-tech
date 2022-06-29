<template>
  <trading-vue :data="dc" :color-back="colors.colorBack" :color-grid="colors.colorGrid" :color-text="colors.colorText"
    ref="tradingVue">
  </trading-vue>
</template>
<script lang="ts">
import { Options, Vue } from 'vue-class-component';
// @ts-ignore
import { DataCube } from 'trading-vue3-js';
import TradingVue from 'trading-vue3-js/src/TradingVue.vue';

@Options({
  components: {
    TradingVue,
  }
})
export default class Chart extends Vue {
  colors = {
    colorBack: '#fff',
    colorGrid: '#eee',
    colorText: '#333',
  }
  chartWidth = 5;

  dc: DataCube = new DataCube({
    chart: {
      type: 'Candles',
      data: [],
      tf: '1m'
    }, onchart: [], offchart: []
  });

  mounted() {
    (window as any).tv = this.$refs.tradingVue;
  }

  updateChart(candles: number[][]) {
    this.dc.set('chart.data', candles);
    const ltsStamp = new Date(candles[candles.length - 1][0]);
    const fstTime = new Date(ltsStamp).setMinutes(ltsStamp.getMinutes() - this.chartWidth);
    const ltsTime = new Date(ltsStamp).setMinutes(ltsStamp.getMinutes() + this.chartWidth);

    (this.$refs.tradingVue as any).setRange(fstTime.valueOf(), ltsTime.valueOf());
  }
}
</script>