// const test = require('ava')
const DB = require('../src/db')
const LCache = require('layered-cache')
const Layer = LCache.Layer
const _LRU = require('lru-cache')
const Loader = require('../../compton/loader/stock.qq.com')

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


const memory = new Layer(new LRU)
.on('data', data => {
  console.log('memory', data)
})

const db = new Layer(
  new DB({
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: 'kael',
      password: '123456',
      database: 'compton'
    },
    code: 'sz002239'
  })
)
.on('data', data => {
  console.log('db', data)
})

const remote = new Layer(
  new Loader('sz002239')
)
.on('data', data => {
  console.log('remote', data)
})

const cache = new LCache([
  memory,
  db,
  remote
])


cache.get({
  span: 'DAY',
  time: + new Date(2017, 4, 5, 11, 8)
})
.then(result => {
  console.log('result', result)
})
.catch(err => {
  console.error(err)
})
