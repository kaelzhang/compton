import request from 'request'
import node_url from 'url'
import padStart from 'lodash.padstart'
import Queue from 'pending-queue'
import map from 'array-map-sorted'


//  date            open    close   high    low     volume
// ["201609300935","9.960","9.950","9.990","9.940","1164.000"]

// referrer
// http://gu.qq.com/sz300131?pgv_ref=fi_smartbox&_ver=2.0

// req:
// http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=sz300131,m5,,320&_var=m5_today&r=0.23718283001260598

// suspension
// http://stockjs.finance.qq.com/sstock/list/suspension/js/sz000829.js?0.9345282303402396


const PRESETS = [
  {
    span: 'MINUTE5',
    key: 'minute5',
    url: 'http://ifzq.gtimg.cn/appstock/app/kline/mkline?param={code},m5,,10000',
    prop: 'm5',
    formatTime: minuteString,
    parseTime: parseMinute
  },

  {
    span: 'MINUTE15',
    key: 'minute15',
    url: 'http://ifzq.gtimg.cn/appstock/app/kline/mkline?param={code},m15,,10000',
    prop: 'm15',
    formatTime: minuteString,
    parseTime: parseMinute
  },

  {
    span: 'MINUTE30',
    key: 'minute30',
    url: 'http://ifzq.gtimg.cn/appstock/app/kline/mkline?param={code},m30,,10000',
    prop: 'm30',
    formatTime: minuteString,
    parseTime: parseMinute
  },

  {
    span: 'MINUTE60',
    key: 'minute60',
    url: 'http://ifzq.gtimg.cn/appstock/app/kline/mkline?param={code},m60,,10000',
    prop: 'm60',
    formatTime: minuteString,
    parseTime: parseMinute
  },

  {
    span: 'MONTH',
    key: 'month',
    url:
    'http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_monthqfq&param={code},month,,,320,qfq',
    prop: 'qfqmonth',
    formatTime: dayString,
    parseTime: parseDay,
    replace: string => string.replace(/^kline_monthqfq=/, '')
  },

  {
    span: 'WEEK',
    key: 'week',
    url: 'http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={code},week,,,320,qfq',
    prop: 'qfqweek',
    // match: (time, record_time) =>
      // new Week(time).inSamePeriod(record_time)
    formatTime: dayString,
    parseTime: parseDay
  },

  {
    span: 'DAY',
    key: 'day',
    url: 'http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={code},day,,,10000,qfq',
    // The key of the response data
    prop: 'qfqday',

    // Transform request time -> response time format
    // Date -> 2017-09-01
    formatTime: dayString,
    parseTime: parseDay
  }
]

const PRESET_MAP = {}
PRESETS.forEach((preset) => {
  PRESET_MAP[preset.span] = preset
})


const queue = new Queue({
  load: ({
    span,
    code
  }) => {

    const preset = PRESET_MAP[span]
    if (!preset) {
      throw new Error('invalid time span.')
    }

    const url = preset.url.replace('{code}', code)

    return new Promise((resolve, reject) => {
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

        if (preset.replace) {
          body = preset.replace(body)
        }

        let json
        try {
          json = JSON.parse(body)
        } catch (e) {
          return reject(e)
        }

        resolve(json)
      })
    })
  }
})


export default class Loader {
  constructor (code) {
    this._code = code.toLowerCase()
  }

  async mget (...keys) {
    const {span} = keys[0]

    if (!span) {
      return Promise.reject(new Error('span should be specified.'))
    }

    const candlesticks = await this._fetchAll(span)
    const length = candlesticks.length

    return map(
      keys,
      candlesticks.map(datum => convertDatum(datum, span)),
      ({time, latest}, candlestick, index, i) => {
        if (latest) {
          return i === length - 1
        }

        if (time) {
          return time === + candlestick.time
        }
      }, null)
  }

  async get ({
    // `timestamp`
    time,
    // `Enum.<DAY|...>`
    span,
    // `Boolean` get the latest candlestick
    latest
  }) {

    if (!span) {
      return Promise.reject(new Error('span should be specified.'))
    }

    if (!time) {
      if (latest) {
        return this._fetchLatest(span)
      }
    }

    time = new Date(time)

    return this._fetch(time, span)
  }

  // Fetch data from remote
  _fetch (time, span) {
    return this._fetchAll(span)
    .then(candlesticks => {
      return this._parse(candlesticks, span, time)
    })
  }

  // @returns candlesticks
  _fetchAll (span) {
    return queue.add({
      span,
      code: this._code
    })
    .then(data => {
      const preset = PRESET_MAP[span]
      return data.data[this._code][preset.prop]
    })
  }

  _fetchLatest (span) {
    return this._fetchAll(span)
    .then(candlesticks => {
      if (!candlesticks.length) {
        return null
      }

      const latest = candlesticks[candlesticks.length - 1]
      return convertDatum(latest, span)
    })
  }

  // Search result from data
  _parse (candlesticks, span, time) {
    const preset = PRESET_MAP[span]

    // m5 queue has no params
    const stock_time = preset.formatTime(time)

    const index = candlesticks.findIndex(([record_time]) => {
      return stock_time === record_time
    })

    // If not found
    if (!~index) {
      return null
    }

    const found = candlesticks[index]

    const [
      ,
      open,
      close,
      high,
      low,
      volume
    ] = found.map(Number)

    return {
      time,
      open,
      close,
      high,
      low,
      volume
    }
  }
}


function padNumber (number) {
  return padStart('' + number, 2, '0')
}


function dayString (time) {
  time = new Date(time)

  const right = [
    time.getMonth() + 1,
    time.getDate()
  ].map(padNumber).join('-')

  return `${time.getFullYear()}-${right}`
}


function minuteString (time) {
  const right = [
    time.getMonth() + 1,
    time.getDate(),
    time.getHours(),
    time.getMinutes()
  ].map(padNumber).join('')

  return `${time.getFullYear()}${right}`
}


function parseMinute (timestring) {
  const [
    Y, M, D,
    h, m
  ] = timestring.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/).slice(1)

  return new Date(Y, M - 1, D, h, m)
}


function parseDay (timestring) {
  const [Y, M, D] = timestring.split('-')
  return new Date(Y, M - 1, D)
}


function convertDatum (datum, span) {
  const [
    ,
    open,
    close,
    high,
    low,
    volume
  ] = datum.map(Number)

  const timestring = datum[0]

  const preset = PRESET_MAP[span]

  // Transform time string -> Date
  const time = preset.parseTime
    ? preset.parseTime(timestring)
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
