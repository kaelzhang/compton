import skema from 'skema'

const _candlestick = skema({
  rules: {
    open: {
      type: Number
    },
    high: {
      type: Number
    },
    low: {
      type: Number
    },
    close: {
      type: Number
    },
    volume: {
      type: Number
    },
    time: {
      type: Date
    }
  },
  clean: true
})


export const candlestick = data => _candlestick.parse(data)
