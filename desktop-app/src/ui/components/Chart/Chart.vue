<template>
  <trading-vue :data="dc" :width="width" :height="height" :titleTxt="title" :color-back="colors.colorBack"
    :color-grid="colors.colorGrid" :color-text="colors.colorText" ref="tradingVue">
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
  @Prop() title!: string;

  chartWidth = 12;
  colors = {
    colorBack: '#fff',
    colorGrid: '#eee',
    colorText: '#333',
  }
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

  declare $refs: {
    tradingVue: HTMLFormElement,
  }

  mounted() {
    (window as any).tv = this.$refs.tradingVue;
    this.dc.onrange(console.log);
    // (window as any).dc = this.dc;
  }

  updateChart(candles: number[][]) {
    this.dc.set('chart.data', candles);

    this.candles = candles;
    const ltsStamp = new Date(candles[candles.length - 1][0]);
    const fstTime = new Date(ltsStamp).setMinutes(ltsStamp.getMinutes() - this.chartWidth);
    const ltsTime = new Date(ltsStamp).setMinutes(ltsStamp.getMinutes() + this.chartWidth);

    this.$refs.tradingVue.setRange(fstTime.valueOf(), ltsTime.valueOf());
  }

  updateTrades(deals: [number, 0 | 1, number, string?][]) {
    this.dc.set('onchart.Trades.data', deals);
  }
}
</script>