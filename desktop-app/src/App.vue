<template>
  <Welcome />
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import Welcome from './screens/Welcome.vue';

@Options({
  components: {
    Welcome,
  },
})
export default class App extends Vue {}
</script>

<style>
@import './style.css';
</style>
