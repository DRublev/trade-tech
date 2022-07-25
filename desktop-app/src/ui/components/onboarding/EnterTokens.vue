<template lang="">
  <div class="flex flex-col items-center">
    <EnterRealTokens v-if="!isSandbox" @enterTokens="enterTokens" />
    <EnterSandboxToken v-else />
  </div>
</template>
<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop, Emit } from "vue-property-decorator";

import EnterRealTokens from "./EnterRealTokens.vue";
import EnterSandboxToken from "./EnterSandboxToken.vue";

@Options({
  components: {
    EnterRealTokens,
    EnterSandboxToken,
  },
})
export default class EnterTokens extends Vue {
  @Prop() isSandbox!: boolean;

  @Emit("enterTokens")
  enterTokens(tokens: any) {
    return tokens;
  }
}
</script>
<style lang=""></style>
