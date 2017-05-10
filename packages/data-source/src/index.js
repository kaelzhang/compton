const {
  Second,
  Minute,
  Minute5,
  Minute15,
  Minute30,
  Minute60,
  Day,
  Week,
  Month
} = require('time-spans')

const TIME_SPANS_MAP = {
  'SECOND'  : Second,
  'MINUTE'  : Minute,
  'MINUTE5' : Minute5,
  'MINUTE15': Minute15,
  'MINUTE30': Minute30,
  'MINUTE60': Minute60,
  'DAY'     : Day,
  'WEEK'    : Week,
  'Month'   : Month
}

const DB = require('./db')
const _LRU = require('lru-cache')
const LCache = require('layered-cache')
// const Loader = require('../../compton/loader/stock.qq.com')

function Time (time, span) {
  const Klass = TIME_SPANS_MAP[span]
  return new Klass(time)
}


class LRU {
  constructor () {
    this._cache = new _LRU({
      max: 10000
    })
  }

  get (key) {
    return this._cache.get(JSON.stringify(key))
  }

  set (key, value) {
    return this._cache.get(JSON.stringify(key))
  }
}

class DataSource {
  constructor ({
    // @type `enum.<mysql>` only support `mysql` for now
    client,
    // @type `Object` The knex connection
    connection,
    // @type `String` The stock code, example: `sz000401`
    code,
    // @type `Class`
    loader
  }) {

    const _loader = new loader(code)
    const db = new DB({
      client,
      connection,
      code
    })
    const lru = new LRU

    this._cache = new LCache([
      lru,
      db,
      _loader
    ])
  }

  get ({
    // @type `String.<MONTH|DAY|...>`
    span,
    // @type `Timestamp`
    time,
    // @type `Array.<[start, end]>`
    between
  }) {

    if (time) {
      return this._get({span, time})
    }

    return Promise.all(
      this._data_period(span, between)
      .map(time => this._get({span, time}))
    )
  }

  _data_period (span, between) {
    const period = []
    const [start, end] = between.map(time => Time(time, span))

    const end_timestamp = end.timestamp()
    let timestamp
    let offset = 0

    while ((timestamp = start.offset(offset ++)) <= end_timestamp) {
      period.push(timestamp)
    }

    return period
  }

  _get (what) {
    return this._cache.get(what)
  }

  set (what, value) {
    return this._cache.set(what, value)
  }
}


module.exports = DataSource
