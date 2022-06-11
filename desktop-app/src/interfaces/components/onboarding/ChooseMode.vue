<template>
  <h3 class="text-2xl mb-1 mt-24">Sandbox или боевой режим?</h3>
  <p>Это можно поменять в любой момент</p>
  <div class="mt-8 space-x-8">
    <button @click="chooseMode(false)" class="border rounded-full font-medium px-6 py-2">Боевой</button>
    <button @click="chooseMode(true)" class="bg-purple-600 rounded-full font-medium px-6 py-2 text-white">Sandbox</button>
  </div>
</template>
<script lang="ts">
import { Options, Vue } from 'vue-class-component';

@Options({
  props: {
    chooseMode: {
      type: Function,
      required: true,
    },
  }
})
export default class ChooseMode extends Vue {
  
}
</script>