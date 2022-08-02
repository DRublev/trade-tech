<template>
  <h2>Debugging Spread Strategy Logs</h2>
  <ul class="text-left ml-16">
    <li v-for="log in logs" :key="log">{{ log }}</li>
  </ul>
</template>
<script lang="ts">
import { Vue } from 'vue-class-component';
import DebugStrategyUseCase from '@/ui/logic/DebugStrategy';

export default class Debug extends Vue {
  private debugStrategyUC = new DebugStrategyUseCase();

  mounted() {
    this.debugStrategyUC.startStrategy();
  }

  get logs() {
    return this.debugStrategyUC.Logs;
  }
}
</script>