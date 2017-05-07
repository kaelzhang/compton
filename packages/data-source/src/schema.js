const candlestick = skema({
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


module.exports = {
  candlestick: data => candlestick.parse(data)
}
