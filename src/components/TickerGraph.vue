<script>
import CloseSvg from '@/assets/svg/close.svg'

export default {
  name: 'TickerGraph',
  components: { CloseSvg },
  data() {
    return {
      widthBar: 24,
      maxGraphElements: 1,
      innerGraph: []
    }
  },
  props: {
    selectedTicker: {
      type: [Object, null],
      default: null,
      required: true
    },
    graph: {
      type: Array,
      default: [],
      required: true
    }
  },
  computed: {
    normalizedGraph() {
      const max = Math.max(...this.innerGraph)
      const min = Math.min(...this.innerGraph)

      if (max === min) return this.innerGraph.map(() => 50)

      return this.innerGraph.map((price) => 5 + ((price - min) * 95) / (max - min))
    }
  },
  watch: {
    selectedTicker: {
      handler() {
        this.$nextTick().then(this.calculateMaxGraphElements)
        this.innerGraph = this.graph
      },
      immediate: true
    },
    maxGraphElements() {
      this.checkGraphSize()
    },
    graph: {
      handler() {
        this.checkGraphSize()
      },
      graph: {
        handler() {
          this.checkGraphSize()
        },
      deep: true,
      immediate: true
    }
  },

  methods: {
    close() {
      this.$emit('close-graph')
    },

    calculateMaxGraphElements() {
      if (!this.$refs.graph) {
        return
      }
      this.maxGraphElements = this.$refs.graph.clientWidth / this.widthBar
    },

    checkGraphSize() {
      if (this.graph.length > this.maxGraphElements) {
        this.innerGraph = this.graph.slice(this.graph.length - this.maxGraphElements + 1)
      }
    }
  },

  mounted() {
    window.addEventListener('resize', this.calculateMaxGraphElements)
    this.innerGraph = this.graph
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.calculateMaxGraphElements)
  }
}
</script>

<template>
  <div class="pt-4">
    <div class="flex items-center justify-between">
      <div>{{ selectedTicker.name }} - USD</div>
      <div @click="close">
        <close-svg class="cursor-pointer" />
      </div>
    </div>
    <div class="border-l border-b border-slate-400 h-60 w-full mt-4 flex items-end" ref="graph">
      <div
        v-for="(bar, idx) in normalizedGraph"
        :key="idx"
        :style="{ height: `${bar}%`, width: `${this.widthBar}px` }"
        class="bg-purple-800 bar"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.bar {
  margin-right: 1px;
}

.bar:first-child {
  margin-left: 1px;
}
</style>
