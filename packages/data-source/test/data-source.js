const test = require('ava')
const DB = require('../lib/db')
const LCache = require('layered-cache')
const Layer = LCache.Layer
const _LRU = require('lru-cache')

const db = new Layer(
  new DB({
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: 'kael',
      password: '123456',
      database: 'compton'
    }
  })
)

class LRU {
  constructor () {
    this._cache = new _LRU({
      max: 10000
    })
  }

  get (data) {
    return this._cache.get(JSON.stringify(data))
  }

  set (data) {
    return this._cache.get(JSON.stringify(data))
  }
}


const memory = new Layer(new LRU)

const cache = new LCache([
  new LRU(),
  db,
  new Loader()
])
