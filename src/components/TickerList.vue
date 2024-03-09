<script>
import DeleteSvg from '@/assets/svg/delete.svg'

export default {
  name: 'TickerList',
  components: { DeleteSvg },
  props: {
    paginatedTickers: {
      type: Array,
      default: [],
      required: true
    },
    selectedTicker: {
      type: Object,
      default: null,
      required: false
    }
  },
  methods: {
    select(selectedTicker) {
      this.$emit('select-ticker', selectedTicker)
    },
    remove(tickerToRemove) {
      this.$emit('remove-ticker', tickerToRemove)
    }
  }
}
</script>

<template>
  <div class="py-5 flex flex-wrap justify-center">
    <div
      v-for="t in paginatedTickers"
      :key="t.name"
      class="rounded py-2 cursor-pointer w-1/4 flex justify-center max-sm:w-full m-1"
      :class="{
        'border-2 border-indigo-800': selectedTicker === t,
        'bg-red-100': t.error === true
      }"
      @click="select(t)"
    >
      <div>
        <div class="text-slate-400 mb-2 w-fit">{{ t.name }} - USD</div>
        <div class="w-fit">{{ t.price }}</div>
        <div
          class="text-slate-500 flex items-center cursor-pointer w-fit mt-8 hover:text-red-700"
          @click.stop="remove(t)"
        >
          <delete-svg class="mr-0.5" />
          Remove
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
