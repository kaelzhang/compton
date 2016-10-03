const DataSource = require('..')

const ds = new DataSource('time_share')
  .connect('default', require('sails-disk'), true)
  .scheme(name, {
    closed: 'boolean'
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
  .load()
  .ready((dataSource) => {

  })
