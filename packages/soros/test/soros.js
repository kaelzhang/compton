const DataSource = require('data-source')
const {
  Loader
} = require('../loader/stock.qq.com')
const TIME_SPAN = DataSource.TIME_SPAN

const NULLABLE_FLOAT = {
  type: 'float',
  empty: true
}

new DataSource('sz300131')
  .connect('default', require('sails-disk'), true)

  // Whether the stock market is opened at a time.
  // It doesn't indicate whether a specific stock is suspended
  .open((time) => {
    const hours = time.getHours()
    const minutes = time.getMinutes() + hours * 60

    // (9:30 - 11:30]
    // (13:00 - 15:00]
    return (
      hours > 9 * 60 + 30
      && hours <= 11 * 60
    )
    || (
      hours > 13 * 60
      && hours <= 15 * 60
    )
  })
  .schema({
    open  : NULLABLE_FLOAT,
    high  : NULLABLE_FLOAT,
    low   : NULLABLE_FLOAT,
    close : NULLABLE_FLOAT,
    time  : {
      type  : 'datetime',
      index : true,
      unique: true
    },
    volume: 'integer'
  })
  .schema('suspension', {
    stock: 'string',
    stock_cn: 'string',
    begin: 'datetime',
    end: {
      type: 'datetime',
      empty: true
    },
    reason: {
      type: 'string',
      empty: true
    }
  })
  .loader(Loader)
  .ready((err, dataSource) => {
    if (err) {
      console.error(err)
      process.exit(1)
      return
    }

    dataSource.get({
      span: TIME_SPAN.DAY,
      // time: new Date(2016, 8, 29, 15)
      between: [
        new Date(2016, 8, 29, 13),
        new Date(2016, 8, 29, 15)
      ]
    })
    .then((candlestick) => {
      console.log(candlestick)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
  })
