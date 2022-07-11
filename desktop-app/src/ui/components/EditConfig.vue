<template>
  <section class="px-3">
    <h4 class="text-left text-2xl mb-3">Config</h4>
    <div v-for="key in keys" :key="key">
      <label class="pl-3">{{ key }}</label>
      <input :placeholder="key" v-model="edited[key]" type="number" class="text-left rounded-2xl" />
    </div>
    <button class="w-full px-6 py-2 text-center border rounded-2xl text-white bg-slate-800" @click="save">
      Save
    </button>
  </section>
</template>
<script lang="ts">
import { TradingConfig } from '@/node/domain/TradingConfig';
import { Vue } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';


export default class EditConfig extends Vue {
  @Prop() readonly config!: TradingConfig;
  edited: any = {};

  mounted() {
    this.edited = { ...this.config.parameters };
  }

  save() {
    this.$emit('save', Object.assign({}, this.edited));
  }

  get keys() { return Object.keys(this.config.parameters); }
}
</script>
<style scoped>
input {
  border: 1px solid #ddd;
  min-height: 40px;
  padding: 5px 15px;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}
</style>