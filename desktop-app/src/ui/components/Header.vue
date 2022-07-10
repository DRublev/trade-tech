<template>
  <nav class="w-full px-5 py-4 flex flex-row justify-end">
    <div>
      <UserActives />
    </div>
    <div class="ml-3">
      <span class="relative inline-flex rounded-md shadow-md">
        <button type="button"
          class="inline-flex items-center px-3 py-2 bg-white text-base leading-6 font-medium rounded-md text-gray-800 bg-white hover:text-gray-700 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150">
          <fa :icon="['far', 'bell']" class="text-l align-baseline" />
        </button>
        <span class="flex absolute h-3 w-3 top-0 right-0 -mt-1 -mr-1 pointer-events-none">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
        </span>
      </span>
    </div>
  </nav>
</template>
<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import UserActives from './UserActives.vue';

@Options({
  components: {
    UserActives,
  },
})
export default class Header extends Vue {

}
</script>

<style scoped>
nav {
  line-height: 40px;
}
</style>