module.exports = queue

const { EventEmitter } = require('events')

// ```
// const q = queue({
//   load: (param) => {
//     return new Promise()
//   }
// })
//
// q
//   .add(param)
//   .then(() => {

//   })
// ```

function queue ({
  load,
  retry = 3

}) {

  const emitter = new EventEmitter()
  emitter.setMaxListeners(0)

  const results = {}

  function add (param = '', callback) {
    let key

    if (arguments.length === 1) {
      callback = param
      key = ''

    } else {
      key = JSON.stringify(param)
    }

    if (key in results) {
      return callback(...results[key])
    }

    emitter.on(key, callback)

    if (emitter.listenerCount(key) === 1) {
      loadResource(param, load, retry)
      .then((data) => {
        results[key] = [null, data]
        emitter.emit(key, null, data)
        emitter.removeAllListeners(key)
      })
      .catch((err) => {
        emitter.emit(key, err)
        // again
        emitter.removeAllListeners(key)
      })
    }
  }

  return {
    // expose cache so that we could handle it
    cache: results,
    add: (param) => {
      return new Promise((resolve, reject) => {
        add(param, (err, data) => {
          if (err) {
            return reject(err)
          }

          resolve(data)
        })
      })
    }
  }
}


function loadResource (param, load, retry) {
  -- retry

  return load(param)
  .then((data) => {
    return data
  })
  .catch((err) => {
    if (retry < 0) {
      return Promise.reject(err)
    }

    return loadResource(param, load, retry)
  })
}
