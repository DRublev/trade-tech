<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <Welcome msg="Welcome to Your Vue.js App"/>
</template>

<script>
import Welcome from './use-cases/welcome/Welcome.vue'

export default {
  name: 'App',
  components: {
    Welcome
  }
}
</script>

<style>
@import './style.css';
</style>
