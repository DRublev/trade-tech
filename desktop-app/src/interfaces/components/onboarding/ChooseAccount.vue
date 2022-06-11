<template>
  <h3 class="text-2xl mb-1 mt-24">Нашли несколько активных аккаунтов, какой нужный?</h3>
  <p>Можно будет поменять в любой момент</p>

  <p class="mt-6">Вот список:</p>

  <div class="mt-8 space-x-8 px-12">
    <button @click="done()" class="border border-purple-600 text-purple-600 rounded-full font-medium px-6 py-2">Далее</button>
  </div>
</template>
<script lang="ts">
import { Options, Vue } from 'vue-class-component';

@Options({
  props: {
    accountOptions: {
      type: Array,
      default: [],
    },
  }
})
export default class ChooseAccount extends Vue {
  done() {

  }
}
</script>