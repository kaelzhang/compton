// const day = {
//   open =,
//   // the highest value
//   high =,
//   // the lowest value
//   low =,
//   // the last value
//   close =,
//   // transaction volumn
//   volume =,
//   // close / current time
//   time
// }


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
