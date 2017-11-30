import DB from './db'
import Synchronizer from './synchronizer'
import _LRU from 'lru-cache'
import LCache from 'layered-cache'
import {isClosed} from './checker'
import findLastIndex from 'lodash.findlastindex'

class LRU {
  constructor (max, validate) {
    this._cache = new _LRU({
      max
    })

    this.validate = validate
  }

  get (key) {
    return this._cache.get(JSON.stringify(key))
  }

  set (key, value) {
    return this._cache.set(JSON.stringify(key))
  }
}


class Filter {
  constructor (filter, span) {
    this._filter = filter
    this._span = span
  }

  async get (time) {
    if (!time || await this._filter({time, span: this._span})) {
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

// undefined -> marked as not found
// null      -> found, but null value
const isNotFound = value => value === undefined

class DataSourceSpan {
  constructor (span, {
    // @type `enum.<mysql>` only support `mysql` for now
    // client,
    // @type `Object` The knex connection
    connection,
    // @type `String` The stock code, example: `sz000401`
    code,
    // @type `Class`
    loader: Loader,
    // @type `function({time, span}): Boolean`
    //   whether a stock market is trading
    isTrading,
    request,
    maxCacheItems = 1000
  }) {

    this._span = span
    this._isClosed = this._isClosed.bind(this)

    const db = this._db = new DB({
      client,
      connection,
      code,
      span,
      validate: this._isClosed
    })

    const lru = new LRU(maxCacheItems, this._isClosed)

    const loader = this._loader = new Loader(code, span, {request})

    this._source = new LCache([
      new Filter(isTrading),
      lru,
      db,
      loader
    ], {
      isNotFound
    })

    this._request = request

    const updateLoader = new Loader(code, span, {
      request: this._request,
      loaded: this._update.bind(this)
    })

    this._sync = new Synchronizer(this._db, updateLoader)
  }

  _isClosed (time) {
    return isClosed(time, this._span)
  }

  async _update (data) {
    const index = findLastIndex(data, ({time}) => isClosed(time))
    if (!~index) {
      return
    }

    const closedDataPairs = data
    .slice(0, index + 1)
    .map(value => [, value])

    await this._source.mset(...closedDataPairs)

    const last = data[index]
    await this._sync.updated(last.time)
  }

  sync ([from, to]) {
    return this._sync.sync([from, to])
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
