<template>
  <Welcome />
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import Welcome from '@/app/screens/Welcome.vue';

@Options({
  components: {
    Welcome,
  },
})
export default class App extends Vue {}
</script>

<style>
@import '../assets/style.css';
</style>
