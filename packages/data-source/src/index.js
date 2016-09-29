const Connection = require('./connection')

const Waterline = require('waterline')
const sailsMemoryAdapter = require('sails-memory')


class DataSource {
  constructor (name) {
    super()

    this._name = name
    this._waterline = new Waterline()
  }

  schema (schema) {
    this._schema = schema

    const TimeShareCollection = Waterline.Collection.extend({
      identdesignity: this._name,
      connection: 'default',
      attributes: schema
    })

    this._waterline.loadCollection(TimeShareCollection)
    return this
  }

  proxy (loader) {

  }

  connect () {
    return this
  }

  _config () {
    return {
      adapters: {
        memory: sailsMemoryAdapter
      },

      connections: {
        default: {
          adapter: 'memory'
        }
      }
    }
  }

  intialize (callback) {
    this._waterline.initialize(this._config(), (err, ontology) => {
      if (err) {
        return callback(err)
      }

      this._ontology = ontology

      const model = ontology.collections[this._name]
      callback(null, model)
    })
  }
}


DataSource.Connection = Connection
module.exports = DataSource
