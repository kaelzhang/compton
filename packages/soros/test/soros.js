const DataSource = require('data-source')
const QQLoader = require('../loader/stock.qq.com')
const TIME_SPANS = DataSource.TIME_SPANS

const NULLABLE_FLOAT = {
  type: 'float',
  empty: true
}

new DataSource('sz300131')
  .connect('default', require('sails-disk'), true)
  .schema({
    closed: {
      type: 'boolean',
      defaultsTo: false
    },
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
  .loader(QQLoader)
  .ready((err, dataSource) => {
    if (err) {
      console.error(err)
      process.exit(1)
      return
    }

    dataSource.get({
      span: TIME_SPANS.WEEK,
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
