<template>
  <trading-vue :data="dc" :color-back="colors.colorBack" :color-grid="colors.colorGrid" :color-text="colors.colorText"
    ref="tradingVue" :index-based="false">
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
  dc: DataCube = new DataCube({
    chart: {
      type: 'Candles',
      data: [],
    }, onchart: [], offchart: []
  });

  updateChart(candles: number[][]) {
    this.dc.set('chart.data', candles);
    (this.$refs.tradingVue as any).goto(candles[candles.length - 1][0]);
  }
}
</script>