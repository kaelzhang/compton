//  date            open    close   high    low     volume
// ["201609300935","9.960","9.950","9.990","9.940","1164.000"]

// referrer
// http://gu.qq.com/sz300131?pgv_ref=fi_smartbox&_ver=2.0

// req:
// http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=sz300131,m5,,320&_var=m5_today&r=0.23718283001260598

// suspension
// http://stockjs.finance.qq.com/sstock/list/suspension/js/sz000829.js?0.9345282303402396

import * as PRESETS from './preset'
import Queue from 'pending-queue'
import request from 'request'
import node_url from 'url'
import access from 'object-access'
import concat from 'lazy-concat'

const fetch = (url, {
  code,
  span
}) => new Promise((resolve, reject) => {
  request({
    url
  }, (err, response, body) => {
    if (err) {
      return reject(err)
    }

    resolve(body)
  })
})

const equal = ([timeA], [timeB]) => timeA === timeB
// Join two datum,
const reduce = concat.factory({equal})

export default class {
  constructor (code, span, request = fetch) {
    if (!span) {
      throw new Error('span must be specified')
    }

    const preset = PRESETS[span]
    if (!preset) {
      throw new Error(`invalid span "${span}"`)
    }

    this._code = code
    this._span = span
    this._preset = preset
    this._request = request

    const load = this._load.bind(this)
    this._queue = new Queue({load})
  }

  // Returns raw
  async _load (from, to, limit) {
    const {
      url,
      replace,
      prop
    } = this._preset

    const code = this._code
    const requestUrl = url(code, [from, to], limit) + '&r=' + Math.random()

    let body = await this._request(requestUrl, {
      code,
      span: this._span
    })

    if (replace) {
      body = replace(body)
    }

    try {
      return access(JSON.parse(body), ['data', code, prop], [])
    } catch (e) {
      return Promise.reject(new Error('fails to parse json'))
    }
  }

  async between ([from: Date, to: Date]) {
    const {
      map
    } = this._preset

    const tasks = map([from, to])
    .map(([from, to]) => this._queue.add(from, to))

    const data = await Promise.all(tasks)
    return reduce(...data).map(datum => this._formatDatum(datum))
  }

  async _getOne (time) {
    const {
      map,
      formatTime
    } = this._preset

    const formated = formatTime(time)
    const [from, to] = map([time, time])[0]
    const data = await this._queue.add(from, to)

    const index = data.findIndex(datum => {
      return datum[0] === formated
    })

    if (~index) {
      return this._formatDatum(data[index])
    }

    return null
  }

  async latest (limit) {
    const data = await this._queue.add('', '', limit - 1)
    return data.map(datum => this._formatDatum(datum))
  }

  async get (...times: Array<Date>) {
    const length = times.length
    if (length === 0) {
      return null
    }

    return length === 1
      ? this._getOne(times[0])
      : Promise.all(times.map(time => this._getOne(time)))
  }

  _formatDatum (datum) {
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
