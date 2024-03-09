import { openChanel } from '@/broadcastChannel'

const API_KEY = 'b8f810c7bfcc3f4fff2aae909d61940e1d1928949caa12c46da257697da780c6'
const tickersHandlers = new Map()
const errorsHandlers = new Map()
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`)
const AGGREGARE_INDEX = '5'
const ERROR_TYPE = '500'
const ERROR_MESSAGE = 'INVALID_SUB'
export const emptyTickers = new Set()

export const tickersChannel = openChanel('tickers-channel')
export const loadCoins = async () => {
  const response = await fetch('https://min-api.cryptocompare.com/data/all/coinlist?summary=true')
  return Object.values((await response.json()).Data)
}

socket.addEventListener('message', (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
    PARAMETER: params,
    MESSAGE: message
  } = JSON.parse(e.data)

  if (type === ERROR_TYPE && message === ERROR_MESSAGE) {
    const splittedParams = params.split('~')
    const emptyTicker = splittedParams[splittedParams.length - 2]
    emptyTickers.add(emptyTicker)

    const handlers = errorsHandlers.get(type) ?? []
    handlers.forEach((fn) => fn())
  }
  if (type !== AGGREGARE_INDEX || newPrice === undefined) return

  const handlers = tickersHandlers.get(currency) ?? []
  handlers.forEach((fn) => fn(currency, newPrice))

  tickersChannel.channel.postMessage({
    type: 'UPDATE_TICKER',
    content: {
      name: currency,
      newPrice
    }
  })
})

function sendToWb(message) {
  const stringifiedMessage = JSON.stringify(message)

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage)
    return
  }

  socket.addEventListener('open', () => socket.send(stringifiedMessage), { once: true })
}
function subscribeToTickersOnWb(ticker) {
  sendToWb({
    action: 'SubAdd',
    subs: [`${AGGREGARE_INDEX}~CCCAGG~${ticker}~USD`]
  })
}

export const subscribeToTickers = (ticker, ...cbs) => {
  const subscribers = tickersHandlers.get(ticker) ?? []

  tickersHandlers.set(ticker, [...subscribers, ...cbs])
  subscribeToTickersOnWb(ticker)
}

export const unsubscribeFromTickers = (ticker) => {
  sendToWb({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${ticker}~USD`]
  })
  tickersHandlers.delete(ticker)
  emptyTickers.delete(ticker)
}

export const addErrorHandlers = (errorType, ...cbs) => {
  const handlers = errorsHandlers.get(errorType) ?? []

  errorsHandlers.set(errorType, [...handlers, ...cbs])
}
