const DataSource = require('.')

const connection = new DataSource.Connection()

const ds = new DataSource('time_share')
  .scheme({
    open  : 'float',
    high  : 'float',
    low   : 'float',
    close : 'float',
    time  : 'float',
    volume: {
      type  : 'integer',
      index : true,
      unique: true
    }
  })
  .connect(connection)


const model

module.exports = (callback) => {
  if (model) {
    return callback(null, model)
  }

  ds.initialize((err, m) => {
    if (err) {
      return callback(err)
    }

    model = m
    callback(null, m)
  })
}
