const Waterline = require('waterline')
const {
  TIME_SPANS,
  Time
} = require('./time')

class DataSource {
  constructor () {

    this._defaultConnection = null
    this._connections = {}
    this._waterline = new Waterline()
    this._schema = schema
  }

  // waterline connection
  connect (name, connection, isDefault) {
    this._connections[name] = connection
    if (isDefault) {
      this._defaultConnection = name
    }

    return this
  }

  schema (name, schema, connection) {
    if (!connection && !this._defaultConnection) {
      throw new Error('no default connection is specified')
    }

    const TimeShareCollection = Waterline.Collection.extend({
      identity: name,
      connection: connection || this._defaultConnection,
      attributes: schema
    })

    this._waterline.loadCollection(TimeShareCollection)
    return this
  }

  load (loader) {
    this._loader = loader
    return this
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

  _load () {

  }

  ready (callback) {
    this._waterline.initialize(this._config(), (err, ontology) => {
      if (err) {
        return callback(err)
      }

      this._ontology = ontology

      const model = ontology.collections[this._name]
      callback(null, model)
    })
  }

  // @returns {Promise}
  get ({
    span,
    between,
    time
  }) {
    return time
      ? this._getOne(this._date(time, span))
      : this._getMany(this._datePeriod(between, span))
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
    let current = between[0]

    while ((date = current.time()) < max) {
      period.push(date)
      current = current.next()
    }

    return period
  }

  _getOne (date) {

  }

  _getMany (dates) {
    const results = dates.map(date => this._getOne(date))
    return Promise.all(results)
  }

  _loadTimeShare (date) {
    this._load(date)
      .then()
  }

  set () {

  }

  update () {

  }
}


DataSource.TIME_SPANS = TIME_SPANS

module.exports = DataSource
