<template>
  <div id="chart" />
</template>
<script lang="ts">
import { Vue } from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import {
  CandlestickData,
  createChart,
  ISeriesApi,
  OhlcData,
  SeriesMarker,
  Time,
  WhitespaceData,
} from 'lightweight-charts';


export default class Chart extends Vue {
  width: number = 100;
  height: number = 100;
  chartOptions = {
    // borderUpColor: '#333',
    // borderDownColor: '#6868AC',
    // downColor: '#6868AC',
    // upColor: 'transparent',
    // wickUpColor: '#333',
    //  wickDownColor: '#6868AC'
  }
  @Prop() chartData!: OhlcData[];
  @Prop() currentCandle: CandlestickData | WhitespaceData = {
    open: null,
    high: null,
    low: null,
    close: null,
    time: null,
  } as unknown as CandlestickData;
  @Prop() markers!: SeriesMarker<Time>[];

  chartContainer: HTMLElement | null = null;
  chart?: ReturnType<typeof createChart>;
  private candleSeries?: ISeriesApi<"Candlestick">;

  mounted() {
    this.chartContainer = document.querySelector('#chart') || null;
    this.initChart();
    window.addEventListener('resize', this.resize);
  }

  beforeUnmount() {
    window.removeEventListener('resize', this.resize);
  }

  initChart() {
    if (!this.chartContainer) return;
    this.chart = createChart(this.chartContainer, { height: this.height, width: this.width });
    this.candleSeries = this.chart.addCandlestickSeries(this.chartOptions);

    this.candleSeries.setData(this.chartData);
    this.candleSeries.setMarkers(this.markers);
    this.resize();
    this.chart.timeScale().fitContent();
    this.chart.timeScale().scrollToPosition(Math.floor(this.chartData.length / 2), false);
    this.chart.timeScale()
      .subscribeVisibleTimeRangeChange((range) => this.$emit('visibleAreaChanged', range));
    this.chart.priceScale
  }

  @Watch('currentCandle', { immediate: true })
  onCurrentCandleChange(value: CandlestickData | WhitespaceData) {
    if (!this.candleSeries) return;
    this.candleSeries.update(value);
  }

  @Watch('markers', { immediate: true })
  onMarkersChange(newMarkers: any) {
    try {
      if (!this.candleSeries) return;
      this.candleSeries.setMarkers(newMarkers);
    } catch (e) {
      console.error(e);
    }
  }

  resize() {
    try {
      if (!this.chartContainer) return;
      const width = this.chartContainer.parentElement?.clientWidth || 100;
      const height = this.chartContainer.parentElement?.clientHeight || 100;
      this.chart?.resize(width, height);
    } catch (e) {
      console.error(e);
    }
  }
}
</script>