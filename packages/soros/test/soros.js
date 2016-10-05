const DataSource = require('data-source')
const QQLoader = require('../loader/stock.qq.com')
const TIME_SPANS = DataSource.TIME_SPANS


new DataSource('sz300131')
  .connect('default', require('sails-disk'), true)
  .schema('m5', {
    closed: 'boolean',
    open  : 'float',
    high  : 'float',
    low   : 'float',
    close : 'float',
    time  : {
      type  : 'float',
      index : true,
      unique: true
    },
    volume: 'integer'
  })
  .loader(QQLoader)
  .ready((err, dataSource) => {
    if (err) {
      console.error(err)
      process.exit(1)
      return
    }

    dataSource.get({
      span: TIME_SPANS.MINUTE5,
      // time: new Date(2016, 8, 29, 15)
      between: [
        new Date(2016, 8, 29, 13),
        new Date(2016, 8, 29, 15)
      ]
    })
    .then((timeShare) => {
      console.log(timeShare)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
  })
