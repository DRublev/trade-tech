<template>
  <trading-vue :data="dc" :width="width" :height="height" :titleTxt="''" :color-back="colors.colorBack"
    :color-grid="colors.colorGrid" :color-text="colors.colorText" :color-scale="colors.colorScale"
    :color-candle-dw="colors.candleDwn" :color-candle-up="colors.candleUp" ref="tradingVue">
  </trading-vue>
</template>
<script lang="ts">
import { Options, Vue } from 'vue-class-component';
// @ts-ignore
import { DataCube } from 'trading-vue3-js';
import TradingVue from 'trading-vue3-js/src/TradingVue.vue';
import { Prop } from 'vue-property-decorator';

@Options({
  components: {
    TradingVue,
  }
})
export default class Chart extends Vue {
  @Prop() width!: number;
  @Prop() height!: number;

  chartWidth = 12;
  colors = {
    colorBack: 'transparent',
    colorGrid: '#eee',
    colorText: '#313234',
    colorScale: '#313234',
    candleDwn: '#ff0f75',
    candleUp: '#68d8b7',
    // candleUp: '#9b7aff',
  }
  candles: number[][] = [];
  dc: DataCube = new DataCube({
    chart: {
      type: 'Candles',
      indexBased: false,
      data: [],
      tf: '1m'
    }, onchart: [
      {
        type: 'Trades',
        data: [],
        name: 'Trades',
        settings: {
          zIndex: 21,
          // buyColor: '#70938d',
          // sellColor: '#fb474a',
        },
      },
      {
        type: 'Trades',
        data: [],
        name: 'Pending',
        settings: {
          zIndex: 20,
          buyColor: '#879a77',
          sellColor: '#c48586',
        },
      },
    ], offchart: [
      {
        name: "BB%",
        type: "Channel",
        data: [],
        settings: {},
      },
    ]
  });

  declare $refs: {
    tradingVue: HTMLFormElement,
  }

  mounted() {
    (window as any).tv = this.$refs.tradingVue;
    (window as any).dc = this.dc;
  }

  updateChart(candles: number[][], indicators: { [key: string]: any[][] } = {}) {
    this.dc.set('chart.data', candles);

    this.candles = candles;
    const ltsStamp = new Date(candles[candles.length - 1][0]);
    const fstTime = new Date(ltsStamp).setMinutes(ltsStamp.getMinutes() - this.chartWidth);
    const ltsTime = new Date(ltsStamp).setMinutes(ltsStamp.getMinutes() + this.chartWidth);

    if (indicators['BB%']) {
      this.dc.set('offchart[0].data', indicators['BB%']);
    }

    this.$refs.tradingVue.setRange(fstTime.valueOf(), ltsTime.valueOf());
    // this.$refs.tradingVue.goto(candles.length - 1);
  }

  updateTrades(deals: [number, 0 | 1, number, string?][], pendingDeals: [number, 0 | 1, number, string?][]) {
    this.dc.set('onchart.Trades.data', deals);
    this.dc.set('onchart.Pending.data', pendingDeals);

  }
}
</script>