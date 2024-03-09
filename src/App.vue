<script>
import CloseSvg from './assets/svg/close.svg'
import ArrowRight from './assets/svg/arrowRight.svg'
import ArrowLeft from './assets/svg/arrowLeft.svg'
import {
  addErrorHandlers,
  emptyTickers,
  subscribeToTickers,
  tickersChannel,
  unsubscribeFromTickers
} from '@/api'
import { closeChanel } from '@/broadcastChannel'
import AddTicker from '@/components/AddTicker.vue'
import TickerList from '@/components/TickerList.vue'
import TickerGraph from '@/components/TickerGraph.vue'
export default {
  components: {
    TickerGraph,
    TickerList,
    AddTicker,
    CloseSvg,
    ArrowRight,
    ArrowLeft
  },
  data() {
    return {
      filter: '',
      page: 1,
      selectedTicker: null,
      tickers: [],
      graph: [],
      tickersChannel: tickersChannel
    }
  },
  computed: {
    startIndex() {
      return (this.page - 1) * 3
    },
    endIndex() {
      return this.startIndex + 3
    },
    hasNextPage() {
      return this.filteredTickers.length > this.endIndex
    },
    filteredTickers() {
      return this.tickers.filter((ticker) => ticker.name.includes(this.filter.toUpperCase()))
    },
    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex)
    },
    pageStateOptions() {
      return {
        page: this.page,
        filter: this.filter
      }
    }
  },
  watch: {
    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1
      }
    },

    filter() {
      this.page = 1
    },
    pageStateOptions(value) {
      window.history.pushState(
        {},
        '',
        `${window.location.pathname}?page=${value.page}&filter=${value.filter}`
      )
    },

    tickers() {
      localStorage.setItem('ticker-list', JSON.stringify(this.tickers))
      this.tickers.forEach((t) => subscribeToTickers(t.name, this.updateTicker))
    },
    selectedTicker() {
      this.graph = []
    }
  },
  methods: {
    add(ticker) {
      this.tickers = [...this.tickers, ticker]
      this.tickersChannel.channel.postMessage({
        type: 'ADD_REMOVE',
        content: JSON.stringify(this.tickers)
      })
      this.filter = ''
    },

    checkErrorTicker() {
      if (emptyTickers.size) {
        emptyTickers.forEach((emptyTicker) => {
          const ticker = this.tickers.find((t) => t.name === emptyTicker)
          if (ticker) {
            ticker.error = true

            tickersChannel.channel.postMessage({
              type: 'ERROR_TICKER',
              content: ticker.name
            })
          }
        })
      }
    },

    formatPrice(price) {
      if (price === '-') {
        return price
      }

      return price > 1 ? price.toFixed(2) : price.toPrecision(2)
    },

    updateTicker(tickerName, newPrice) {
      const ticker = this.tickers.find((ticker) => ticker.name === tickerName)
      if (ticker) {
        this.updateGraph(ticker)
        ticker.price = this.formatPrice(newPrice)
      }
    },

    updateGraph(ticker) {
      if (this.selectedTicker === ticker) {
        this.graph.push(this.selectedTicker.price)
      }
    },

    handleRemove(tickerToRemove) {
      this.tickers = this.tickers.filter((t) => t !== tickerToRemove)
      this.tickersChannel.channel.postMessage({
        type: 'ADD_REMOVE',
        content: JSON.stringify(this.tickers)
      })

      unsubscribeFromTickers(tickerToRemove.name)

      if (tickerToRemove === this.selectedTicker) {
        this.selectedTicker = null
      }
    },

    select(ticker) {
      this.selectedTicker = ticker
    }
  },

  created() {
    const windowData = Object.fromEntries(new URL(window.location).searchParams.entries())

    if (windowData.filter) {
      this.filter = windowData.filter
    }
    if (windowData.page) {
      this.page = Number(windowData.page)
    }

    const tickersData = JSON.parse(localStorage.getItem('ticker-list'))

    if (tickersData) {
      this.tickers = tickersData
      this.tickers.forEach((ticker) => subscribeToTickers(ticker.name, this.updateTicker))
    }

    addErrorHandlers('500', this.checkErrorTicker)

    this.tickersChannel.channel.onmessage = (event) => {
      const type = event.data.type
      const content = event.data.content

      switch (type) {
        case 'ADD_REMOVE':
          this.tickers = JSON.parse(content)
          break
        case 'UPDATE_TICKER':
          this.updateTicker(content.name, content.newPrice)
          break
        case 'ERROR_TICKER':
          const ticker = this.tickers.find((t) => t.name === content)
          ticker.error = true
          break
      }
    }
  },

  beforeDestroy() {
    closeChanel(this.tickersChannel.name)
  }
}
</script>

<template>
  <div class="my-4 w-3/4 m-auto">
    <div class="flex max-sm:flex-col justify-between">
      <add-ticker :tickers="tickers" @add-ticker="add" />
      <div>
        <div class="text-slate-500">Filter</div>
        <input
          class="mb-2 placeholder:italic placeholder:text-slate-400 text-slate-500 outline-0 focus:border-indigo-400 focus:border border-b p-2 rounded"
          placeholder="For example DOGE"
          type="text"
          v-model="filter"
        />
      </div>
    </div>
    <template v-if="filteredTickers.length">
      <div class="flex justify-center mb-6">
        <div
          v-if="page > 1"
          class="mr-2 px-4 py-1 bg-slate-400 w-fit text-white rounded-full flex items-center cursor-pointer hover:bg-slate-500"
          @click="page = page - 1"
        >
          <arrow-left class="mr-2" />
          Prev
        </div>
        <div
          v-if="hasNextPage"
          class="px-4 py-1 bg-slate-400 w-fit text-white rounded-full flex items-center cursor-pointer hover:bg-slate-500"
          @click="page = page + 1"
        >
          Next
          <arrow-right class="ml-2" />
        </div>
      </div>
      <hr />
      <ticker-list
        :paginated-tickers="paginatedTickers"
        :selected-ticker="selectedTicker"
        @select-ticker="select"
        @remove-ticker="handleRemove"
      />
      <hr />
    </template>
    <ticker-graph
      v-if="selectedTicker"
      :selectedTicker="selectedTicker"
      :graph="graph"
      @close-graph="() => (selectedTicker = null)"
    />
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
