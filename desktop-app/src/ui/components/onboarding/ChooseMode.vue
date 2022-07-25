<template>
  <div class="flex flex-col items-center">
    <h3 class="text-2xl mb-1">Песочница или боевой режим?</h3>
    <p>Это можно поменять в любой момент</p>
    <div class="mt-8 space-x-8 mb-3 w-full flex justify-center">
      <button
        @click="chooseMode(false)"
        class="border rounded-full font-medium px-6 py-2 transition hover:bg-purple-600 hover:text-white flex"
      >
        Боевой
        <span
          v-if="isModeChosen && !isSandbox"
          class="flex justify-center items-center w-6 h-6 bg-purple-200 rounded-full ml-3"
        >
          <fa
            :icon="['far', 'check-circle']"
            class="text-l align-baseline bg-purple text-white"
          />
        </span>
      </button>
      <button
        @click="chooseMode(true)"
        class="bg-purple-100 rounded-full font-medium px-6 py-2 text-white flex"
        disabled="true"
      >
        Песочница
        <span
          v-if="isModeChosen && isSandbox"
          class="flex justify-center items-center w-6 h-6 bg-purple-200 rounded-full ml-3"
        >
          <fa
            :icon="['far', 'check-circle']"
            class="text-l align-baseline bg-purple text-white"
          />
        </span>
      </button>
    </div>
    <p class="text-xs text-gray-400">
      Песочница будет доступна в следующем обновлении
    </p>
  </div>
</template>
<script lang="ts">
import { Vue } from "vue-class-component";
import { Emit, Prop } from "vue-property-decorator";

export default class ChooseMode extends Vue {
  @Prop() isModeChosen!: boolean;
  @Prop() isSandbox!: boolean;

  @Emit("chooseMode")
  chooseMode(e: boolean) {
    return e;
  }
}
</script>
