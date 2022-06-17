<template>
  <div id="chart" class="w-full h-full" />
</template>
<script lang="ts">
import { Vue } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { CandlestickData, createChart, ISeriesApi, OhlcData, WhitespaceData } from 'lightweight-charts';


export default class Chart extends Vue {
  @Prop() width: number = 100;
  @Prop() height: number = 100;
  @Prop() chartData!: OhlcData[];
  @Prop() currentCandle: CandlestickData | WhitespaceData = {
    open: null,
    high: null,
    low: null,
    close: null,
    time: null,
  } as unknown as CandlestickData;

  chartContainer: HTMLElement | null = null;
  chart?: ReturnType<typeof createChart>;
  candleSeries?: ISeriesApi<"Candlestick">;

  mounted() {
    this.chartContainer = document.querySelector('#chart') || null;

    this.initChart();
  }

  initChart() {
    if (!this.chartContainer) return;
    this.chart = createChart(this.chartContainer, { height: this.height, width: this.width, });
    this.candleSeries = this.chart.addCandlestickSeries();
    this.candleSeries.setData(this.chartData);
  }

  @Watch('currentCandle')
  onCurrentCandleChange(value: CandlestickData | WhitespaceData) {
    if (!this.candleSeries) return;
    this.candleSeries.update(value);
  }
}
</script>