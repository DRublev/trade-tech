<template lang="">
  <button
    class="border rounded-full font-medium px-6 py-2 hover:bg-purple transition hover:text-white"
  >
    {{ text }}
  </button>
</template>
<script>
import { Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";

export default class Button extends Vue {}
</script>
<style lang=""></style>
