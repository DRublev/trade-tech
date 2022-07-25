<template lang="">
  <div class="flex flex-col items-center">
    <h2 class="text-2xl mb-3">Всё готово к работе</h2>
    <router-link
      to="/"
      class="border rounded-full font-medium px-6 py-2 transition hover:bg-purple-600 hover:text-white flex"
      >Начать пользоваться</router-link
    >
  </div>
</template>
<script>
import { Vue } from "vue-class-component";
export default class OverviewInfo extends Vue {}
</script>
<style lang=""></style>
