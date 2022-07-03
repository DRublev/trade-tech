<template>
  <trading-vue
    :data="dc"
    :width="width"
    :height="height"
    :color-back="colors.colorBack"
    :color-grid="colors.colorGrid"
    :color-text="colors.colorText"
    ref="tradingVue"
  >
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
  width = 200;
  height = 200;
  candles: number[][] = [];
  dc: DataCube = new DataCube({
    chart: {
      type: 'Candles',
      data: [],
      tf: '1m'
    }, onchart: [{
      type: 'Trades',
      data: [],
      name: 'Trades',
      settings: {},
    }], offchart: []
  });

  mounted() {
    (window as any).tv = this.$refs.tradingVue;
    window.onresize = () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    };
  }

  updateChart(candles: number[][]) {
    this.dc.set('chart.data', candles);
    this.candles = candles;
    const ltsStamp = new Date(candles[candles.length - 1][0]);
    const fstTime = new Date(ltsStamp).setMinutes(ltsStamp.getMinutes() - this.chartWidth);
    const ltsTime = new Date(ltsStamp).setMinutes(ltsStamp.getMinutes() + this.chartWidth);

    (this.$refs.tradingVue as any).setRange(fstTime.valueOf(), ltsTime.valueOf());
  }

  updateTrades(deals: [number, 0 | 1, number, string?][]) {
    // const allCandles = this.candles;
    // this.dc.set('onchart.Trades.data', deals
    //   .map((d, idx) => [allCandles[idx][0], d[1], allCandles[idx][1], d[3]]));
    this.dc.set('onchart.Trades.data', deals);
  }
}
</script>