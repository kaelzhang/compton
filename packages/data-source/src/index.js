const Waterline = require('waterline')
const util = require('util')
const {
  TIME_SPAN,
  TIME_SPAN: {
    MONTH,
    WEEK,
    DAY,
    MINUTE60,
    MINUTE30,
    MINUTE15,
    MINUTE5,
    MINUTE,
    SECOND
  },
  AVAILABLE_TIME_SPANS,
  Time
} = require('./time')

const SPAN_MAP = {
  [MONTH]: 'month',
  [WEEK]: 'week',
  [DAY]: 'day',
  [MINUTE60]: 'minute60',
  [MINUTE30]: 'minute30',
  [MINUTE15]: 'minute15',
  [MINUTE5]: 'minute5',
  [MINUTE]: 'minute',
  [SECOND]: 'second'
}


class DataSourceWrapper {
  constructor (code) {

    this._code = code
    this._defaultConnection = null
    this._connections = {}
    this._waterline = new Waterline()
  }

  // waterline connection
  connect (name, connection, isDefault) {
    this._connections[name] = connection
    if (isDefault) {
      this._defaultConnection = name
    }

    return this
  }

  open (checker) {
    this._openChecker = checker
    return this
  }

  schema (name, schema, connection) {
    if (util.isArray(name)) {
      name.forEach((name) => {
        this._schema(name, schema, connection)
      })

      return this
    }

    if (Object(name) === name) {
      connection = schema
      schema = name

      AVAILABLE_TIME_SPANS.forEach((span) => {
        this._schema(SPAN_MAP[span], schema, connection)
      })

      return this
    }

    this._schema(name, schema, connection)
    return this
  }

  _schema (name, schema, connection) {
    if (!connection && !this._defaultConnection) {
      throw new Error('no default connection is specified')
    }

    const CandlestickCollection = Waterline.Collection.extend({
      identity: name,
      connection: connection || this._defaultConnection,
      attributes: schema
    })

    this._waterline.loadCollection(CandlestickCollection)
  }

  loader (Loader) {
    this._loader = new Loader(this._code)
    return this
  }

  // check whether the stock is suspended during a given time
  suspended (time) {

  }

  _config () {
    const adapters = {}
    const connections = {}

    Object.keys(this._connections).forEach((type) => {
      adapters[type] = this._connections[type]
      connections[type] = {
        adapter: type
      }
    })

    if (this._defaultConnection) {
      this._connections.default = {
        adapter: this._defaultConnection
      }
    }

    return {
      adapters,
      connections
    }
  }

  ready (callback) {
    this._waterline.initialize(this._config(), (err, ontology) => {
      if (err) {
        return callback(err)
      }

      this._ontology = ontology
      callback(null, this)
    })
  }

  // @returns {Promise}
  get ({
    span,
    between,
    time
  }) {
    return time
      ? this._getOne(this._date(time, span), span)
      : this._getMany(this._datePeriod(between, span), span)
  }

  // @returns {Date}
  _date (time, span) {
    return Time(time, span).time()
  }

  // @returns {Array.<Date>}
  _datePeriod (between, span) {
    const period = []
    between = between.map(time => Time(time, span))

    const max = between[1].time()
    const current = between[0]
    let date
    let offset = 0

    while ((date = current.offset(offset ++)) <= max) {
      period.push(date)
    }

    return period
  }

  _getOne (time, span) {
    const Model = this._getModel(span)

    return Model.findOne({
      time: time
    })
    .then((candlestick) => {
      if (candlestick) {
        return this._wrapCandlestick(candlestick, time)
      }

      // if there isn't one, load from the remote
      return this._remoteLoadCandlestick(time, span)
        .then((candlestick) => {
          candlestick = !candlestick
            ? {
                closed: true,
                time
              }
            : this._wrapCandlestick(candlestick, time)

          // and then, create one
          return Model.create(candlestick)
            .then(() => {
              return candlestick
            })
        })
    })
  }

  _wrapCandlestick ({
    open,
    high,
    low,
    close,
    volume,
  }, time) {

    return {
      open,
      high,
      low,
      close,
      volume,
      time
    }
  }

  // @returns {Waterline.Collection}
  _getModel (span) {
    return this._ontology.collections[SPAN_MAP[span]]
  }

  _getMany (dates, span) {
    const results = dates.map(date => this._getOne(date, span))
    return Promise.all(results)
  }

  _remoteLoadCandlestick (time, span) {
    return this._loader.load(time, span)
  }

  // set ({
  //   value,
  //   span,
  //   time
  // }) {
  //   // value: candlestick,
  //   // span: TimeSpan.WEEK,
  //   // time: + new Date


  // }

  // update () {

  // }
}


DataSourceWrapper.TIME_SPAN = TIME_SPAN

module.exports = DataSourceWrapper
