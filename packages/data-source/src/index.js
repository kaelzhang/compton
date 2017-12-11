import DB from './db'
import _LRU from 'lru-cache'
import LCache from 'layered-cache'
import {isClosed} from './compare'
import {Time} from './utils'
import findLastIndex from 'lodash.findlastindex'
import err from 'err-object'

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
    maxCacheItems = 1000,
    offline = false
  }) {

    this._span = span
    this._code = code
    this._isClosed = this._isClosed.bind(this)
    this._lastUpdated = null
    this._offline = offline

    const db = this._db = new DB({
      client,
      connection,
      code,
      span,
      validate: this._isClosed
    })

    const lru = new LRU(maxCacheItems, this._isClosed)

    const loader = this._loader = new Loader(code, span, {request})
    const layers = [
      new Filter(isTrading),
      lru,
      db
    ]

    if (!offline) {
      layers.push(loader)
    }

    this._source = new LCache(layers, {
      isNotFound
    })

    this._updateLoader = new Loader(code, span, {
      request,
      loaded: this._update.bind(this)
    })
  }

  _isClosed (time: Date) {
    return isClosed(time, this._span)
  }

  async _update (data, {requestTime} = {}) {
    const index = findLastIndex(data, ({time}) => this._isClosed(time))
    const closedDataPairs = !!~index
      ? data
        .slice(0, index + 1)
        .map(value => [value.time, value])
      : []

    await this._source.mset(...closedDataPairs)

    // Set the updated time to the current time,
    // otherwise, if the stock is suspended, it will always try to sync.
    requestTime = requestTime || new Date
    const updated_to = this._closestClosedTime(requestTime)
    await this.updated(updated_to)
  }

  _closestClosedTime (time: Date): Date {
    const closedTimestamp = this._isClosed(time)
      ? Time(time, this._span).timestamp()
      // If the request time is not closed,
      // then use the previous time of the span
      : Time(time, this._span).prev()

    return new Date(closedTimestamp)
  }

  async updated (time: Date) {
    await this._db.updated(time)
    this._lastUpdated = time
  }

  async lastUpdated () {
    return this._lastUpdated || (
      this._lastUpdated = await this._db.lastUpdated())
  }

  async sync ([from: Date, to: Date], force) {
    if (this._offline) {
      throw err({
        message: 'could not sync when offline is true',
        name: 'SyncWhenOfflineError',
        code: 'OFFLINE_SYNC'
      })
    }

    if (force) {
      await this._updateLoader.between([from, to])
      return
    }

    const lastUpdated = await this.lastUpdated()
    const {already} = this._alreadyUpdated(to, lastUpdated)
    if (already) {
      return
    }

    if (lastUpdated >= from) {
      await this._updateLoader.between([lastUpdated, to])
      return
    }

    await this._updateLoader.between([from, to])
  }

  get (...times) {
    const length = times.length
    return length === 0
      ? []
      : length === 1
        ? this._source.get(times[0])
        : this._source.mget(...times)
  }

  _alreadyUpdated (to, lastUpdated) {
    if (to) {
      return lastUpdated >= to
        // found in db
        ? {already: true, to}
        // need to fetch from remote
        : {already: false, to}
    }

    to = this._closestClosedTime(new Date)
    return lastUpdated >= to
      // found in db
      ? {already: true, to}
      // remain `to` to undefined
      : {already: false}
  }

  async between ([from, to]) {
    if (this._offline) {
      return this._db.between([from, to || new Date])
    }

    const lastUpdated = await this.lastUpdated()
    const check = this._alreadyUpdated(to, lastUpdated)

    if (check.already) {
      return this._db.between([from, check.to])
    }

    return this._loader.between([from, to])
  }

  latest (limit) {
    return this._loader.latest(limit)
  }
}
