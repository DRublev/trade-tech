<template>
  <trading-vue :data="{ ohlcv }" :color-back="colors.colorBack" :color-grid="colors.colorGrid"
    :color-text="colors.colorText"></trading-vue>
</template>
<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import TradingVue from 'trading-vue3-js/src/TradingVue.vue'


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
  ohlcv = [
    [1551128400000, 33, 37.1, 14, 14, 196],
    [1551132000000, 13.7, 30, 6.6, 30, 206],
    [1551135600000, 29.9, 33, 21.3, 21.8, 74],
    [1551139200000, 21.7, 25.9, 18, 24, 140],
    [1551142800000, 24.1, 24.1, 24, 24.1, 29],
  ]
}
</script>