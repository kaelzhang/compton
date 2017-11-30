import DB from './db'
import Synchronizer from './synchronizer'
import _LRU from 'lru-cache'
import LCache from 'layered-cache'

class LRU {
  constructor (max) {
    this._cache = new _LRU({
      max
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

  async get ({time, span}) {
    if (!time || await this._filter({time, span})) {
      // not found, then go down to next cache layer
      return
    }

    // null value
    return null
  }
}

export default class DataSource {
  constructor (options) {
    this._options = options
    this._spans = Object.create(null)
  }

  span (span) {
    if (span in this._spans) {
      return this._spans[span]
    }

    return this._spans[span] = new DataSourceSpan(span, this._options)
  }
}

const client = 'mysql'
class DataSourceSpan {
  constructor (span, {
    // @type `enum.<mysql>` only support `mysql` for now
    // client,
    // @type `Object` The knex connection
    connection,
    // @type `String` The stock code, example: `sz000401`
    code,
    // @type `Class`
    loader,
    // @type `function(value): Boolean` whether a stock market is trading
    isTrading,
    request,
    maxCacheItems = 1000
  }) {

    const db = this._db = new DB({
      client,
      connection,
      code,
      span
    })

    const lru = new LRU(maxCacheItems)

    this._loader = new loader(code, span, request)

    this._source = new LCache([
      lru,
      db
    ])

    this._sync = new Synchronizer(db)
  }

  sync ([from, to]) {

  }

  get (...times) {
    const length = times.length
    return length === 0
      ? []
      : length === 1
        ? this._source.get(times[0])
        : this._source.mget(...times)
  }

  between ([from, to]) {
    const lastUpdated = this._sync.lastUpdated()
    if (to <= lastUpdated) {
      return this._db.between([from, to])
    }

    return this._loader.between([from, to])
  }

  latest (limit) {
    return this._loader.latest(limit)
  }
}
