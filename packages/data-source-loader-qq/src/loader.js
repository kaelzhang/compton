import Queue from 'pending-queue'
import request from 'request'
import node_url from 'url'
import access from 'object-access'
import map from 'array-map-sorted'

const fetch = (url, code) => new Promise((resolve, reject) => {
  request({
    url,
    headers: {
      'Referrer': `http://gu.qq.com/${code}?pgv_ref=fi_smartbox&_ver=2.0`,
      'Host': node_url.parse(url).hostname,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.116 Safari/537.36'
    }
  }, (err, response, body) => {
    if (err) {
      return reject(err)
    }

    resolve(body)
  })
})

const reduce = array => array.reduce((prev, current) => prev.concat(current))

export default class {
  constructor (code, preset) {
    this._code = code
    this._preset = preset
    this.formatDatum = this.formatDatum.bind(this)

    const load = this._load.bind(this)
    this._queue = new Queue({load})
  }

  // Returns raw
  _load (from, to) {
    const {
      url,
      replace,
      prop
    } = this._preset

    const code = this._code

    return fetch(url(code, [from, to]), code).then(body => {
      if (replace) {
        body = replace(body)
      }

      try {
        return access(JSON.parse(body), ['data', this._code, prop], [])
      } catch (e) {
        return Promise.reject(new Error('fails to parse json'))
      }
    })
  }

  get ([from, to]) {
    const {
      map
    } = this._preset

    // Map the tasks so that it won't request too much data within one request.
    const tasks = map([from, to]).map(([from, to]) => {
      return this._queue.add(from, to)
    })

    return Promise.all(tasks).then(reduce)
  }

  // @param {times} sorted times
  find (data, times) {
    return map(
      times,
      data,
      (time, datum) => {
        const timeString = this._preset.formatTime(time)
        return datum[0] === timeString
      },
      null,
      (time, datum) => this.formatDatum(datum)
    )
  }

  formatDatum (datum) {
    const [
      ,
      open,
      close,
      high,
      low,
      volume
    ] = datum.map(Number)

    const timestring = datum[0]
    const {
      parseTime
    } = this._preset

    // Transform time string -> Date
    const time = parseTime
      ? parseTime(timestring)
      : new Date(timestring)

    return {
      time,
      open,
      high,
      low,
      close,
      volume
    }
  }
}
