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
    client,
    connection,
    code,
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
    span,
    time,
    between
  }) {

    if (time) {
      return this._get({span, time})
    }

    return Promise.all(
      this._get_between_times(span, between)
      .map(time => this._get({span, time}))
    )
  }

  _get_between_times (span, [start, end]) {

  }

  _get (what) {
    return this._cache.get(what)
  }

  set (what, value) {
    return this._cache.set(what, value)
  }
}


module.exports = DataSource
