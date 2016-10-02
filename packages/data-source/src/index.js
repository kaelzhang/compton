const Connection = require('./connection')

const Waterline = require('waterline')
const sailsMemoryAdapter = require('sails-memory')




class DataSource {
  constructor ({
    // waterline connection
    connection,

    // method to load timeShare
    load

  }) {

    this._connection = connection
    this._load = load
    this._waterline = new Waterline()

    this._schema = schema

    const TimeShareCollection = Waterline.Collection.extend({
      identdesignity: this._name,
      connection: 'default',
      attributes: schema
    })

    this._waterline.loadCollection(TimeShareCollection)
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

  get () {

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


module.exports = DataSource
