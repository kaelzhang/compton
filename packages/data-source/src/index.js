import DB from './db'
import Time from './time'
import _LRU from 'lru-cache'
import LCache from 'layered-cache'


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
    return this._cache.set(JSON.stringify(key))
  }
}


class Filter {
  constructor (filter) {
    this._filter = filter
  }

  async get ({time}) {
    if (!time || await this._filter(time)) {
      return
    }

    return null
  }
}

export default class DataSource {
  constructor ({
    // @type `enum.<mysql>` only support `mysql` for now
    client,
    // @type `Object` The knex connection
    connection,
    // @type `String` The stock code, example: `sz000401`
    code,
    // @type `Class`
    loader,
    // @type `function(value): Boolean` whether a stock market is trading
    isTrading
  }) {

    const _loader = new loader(code)
    const db = new DB({
      client,
      connection,
      code
    })
    const lru = new LRU

    this._cache = new LCache([
      new Filter(isTrading),
      lru,
      db,
      _loader
    ], {
      isNotFound: value => value === undefined
    })
  }

  async get ({
    // @type `String.<MONTH|DAY|...>`
    span,
    // @type `Timestamp`
    time,
    // @type `Array.<[start: Date, end?: Date]>`
    between,
    // @type `Boolean` get the latest candlestick
    latest
  }) {

    if (time) {
      return this._get({span, time})
    }

    if (latest) {
      return this._get({span, latest})
    }

    const periods = await this._data_period(span, between)
    const tasks = periods.map(time => {
      return {span, time}
    })

    // If there is no end, then also get the lastest
    if (!between[1]) {
      tasks.push({span, latest: true})
    }

    return this._cache.mget(...tasks)
  }

  _data_period (span, between) {
    if (!between[1]) {
      between[1] = new Date
    }

    const periods = []
    const [
      start,
      end
    ] = between.map(time => Time(time, span))

    const end_timestamp = end.timestamp()
    let timestamp
    let offset = 0

    while ((timestamp = start.offset(offset ++)) <= end_timestamp) {
      periods.push(timestamp)
    }

    return periods
  }

  _get (what) {
    return this._cache.get(what)
  }
}
