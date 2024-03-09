<script>
import PlusSvg from '@/assets/svg/plus.svg'
import { loadCoins } from '@/api'

export default {
  name: 'addTicker',
  components: { PlusSvg },
  data() {
    return {
      ticker: '',
      showTheSameTickerMessage: false,
      notExistedCoin: false,
      hints: [],
      coins: []
    }
  },
  props: {
    tickers: {
      type: Array,
      default: [],
      required: true
    }
  },
  methods: {
    add() {
      if (this.ticker) {
        if (this.coins.find((coin) => coin.Symbol === this.ticker.toUpperCase())) {
          if (this.checkedTheSameTicker()) {
            const currentTicker = {
              name: this.ticker.toUpperCase(),
              price: '-'
            }
            this.$emit('add-ticker', currentTicker)
            this.ticker = ''
            this.hints = []
            this.showTheSameTickerMessage = false
          } else {
            this.showTheSameTickerMessage = true
          }
        } else this.notExistedCoin = true
      }
    },
    checkedTheSameTicker() {
      return !this.tickers.find((t) => t.name === this.ticker.toUpperCase())
    },
    handleTickerInput(ticker) {
      this.showTheSameTickerMessage = false
      this.notExistedCoin = false
      this.debounceSearch(this.createHints, 350)(ticker)
    },
    debounceSearch(func, delay) {
      let timeoutId

      return function () {
        clearTimeout(timeoutId)

        timeoutId = setTimeout(() => func.apply(this, arguments), delay)
      }
    },
    createHints(inputText) {
      this.hints = []

      if (inputText.trim().length >= 2) {
        inputText = inputText.toLowerCase()

        for (let i = 0; i < this.coins.length; i++) {
          if (this.hints.length < 4) {
            if (
              this.coins[i].Symbol.toLowerCase().includes(inputText) ||
              this.coins[i].FullName.toLowerCase().includes(inputText)
            ) {
              this.hints.push(this.coins[i].Symbol)
            }
          } else {
            break
          }
        }
      }
    },
    handleHintClick(hint) {
      this.ticker = hint
      this.add()
    }
  },
  async created() {
    this.coins = await loadCoins()
  }
}
</script>

<template>
  <div>
    <div class="text-slate-500">Ticker</div>
    <input
      class="mb-2 placeholder:italic placeholder:text-slate-400 text-slate-500 outline-0 focus:border-indigo-400 focus:border border-b p-2 rounded"
      placeholder="For example DOGE"
      type="text"
      v-model="ticker"
      @keydown.enter="add"
      @input="handleTickerInput(ticker)"
    />
    <div v-if="hints.length" class="flex mb-2">
      <div
        v-for="(hint, idx) in hints"
        :key="idx"
        class="bg-slate-300 rounded-full w-fit px-2 mr-1 cursor-pointer"
        @click="handleHintClick(hint)"
      >
        {{ hint }}
      </div>
    </div>
    <div v-if="showTheSameTickerMessage" class="text-red-600 text-xs mb-1">
      This ticker already exists
    </div>
    <div v-if="notExistedCoin" class="text-red-600 text-xs mb-1">This coin doesn't exist</div>
    <div
      class="mb-6 px-4 py-1 bg-slate-400 w-fit text-white rounded-full flex items-center cursor-pointer hover:bg-slate-500"
      @click="add"
    >
      <plus-svg class="mr-2" />
      Add
    </div>
  </div>
</template>

<style scoped></style>
