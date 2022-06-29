<template>
  <trading-vue :data="dc" :color-back="colors.colorBack" :color-grid="colors.colorGrid"
    :color-text="colors.colorText" ref="tradingVue" :index-based="false">
  </trading-vue>
</template>
<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import TradingVue from 'trading-vue3-js/src/TradingVue.vue'
import CandleToOhlcvDTO from '@/ui/useCases/strategy/CandleToOhlcvDTO';
// @ts-ignore
import { DataCube } from 'trading-vue3-js';
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
  @Prop() dataCube: any;
  dc: DataCube = new DataCube({
    chart: {
      type: 'Candles',
      data: [],
    }, onchart: [], offchart: []
  });
  private candles: number[][] = [];

  mounted() {
    (window as any).ipc.on('TINKOFF_ON_CANDLES_STREAM', this.processCandle);
    (window as any).tv = this.$refs.tradingVue;
  }

  private async processCandle(e: any, candle: any) {
    const ohlcv = CandleToOhlcvDTO.toOhlcv(candle);
  this.candles.push(ohlcv);
  this.dc.set('chart.data', this.candles);
  // this.dc.onrange(console.log);
  // (this.$refs.tradingVue as any).goto(this.candles[this.candles.length - 1][0]);
(this.$refs.tradingVue as any).resetChart();
    if (!Object.keys(this.dc).length) {
// (this.$refs.tradingVue as any).resetChart();
    } else {

      // this.dc.merge('chart.data', [ohlcv]);
    }
    const allData = this.dataCube.get('chart.data');
    console.log('51 Chart', allData, this.$refs.tradingVue);
    // (this.$refs.tradingVue as any).resetChart();
    // (this.$refs.tradingVue as any).goto(allData[0][0][0]);
    // this.dataCube.tv.setRange(allData[0][0][0], allData[0][allData[0].length - 1][0]);

  }
}
</script>