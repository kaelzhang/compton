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
    return this._cache.get(JSON.stringify(key))
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
    // @type `Array.<[start: Date, end?: Date]>`
    between,
    // @type `Number`
    limit
  }) {

    if (!between && !time) {
      return this._get({span, limit})
    }

    if (time) {
      return this._get({span, time})
    }

    const period = this._data_period(span, between)
    const tasks = period.map(
      time => this._get({span, time})
    )

    // If there is no end, then also get the lastest
    if (!between[1]) {
      tasks.push(this._get({span, limit: 1}))
    }

    return Promise.all(tasks)
    .then(r => {
      
      const results = r.filter(Boolean)
      const length = results.length
      const last = results[length - 1]
      const second_last = results[length - 2]

      if (!last || !second_last) {
        return results
      }

      if (+ second_last.time === + last.time) {
        results.pop()
      }

      return results
    })
  }

  _data_period (span, between) {
    if (!between[1]) {
      between[1] = new Date
    }

    const period = []
    const [
      start,
      end
    ] = between.map(time => Time(time, span))

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
