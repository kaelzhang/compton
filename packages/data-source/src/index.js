const LCache = require('layered-cache')
const LRU = require('lru-cache')

const cache = new LCache([
  new LRU(),
])