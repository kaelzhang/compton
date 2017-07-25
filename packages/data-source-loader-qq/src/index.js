const request = require('request')
const node_url = require('url')
const padStart = require('lodash.padstart')
const Queue = require('pending-queue')

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
    // TODO
    // time
  },

  {
    span: 'MINUTE15',
    key: 'minute15',
    url: 'http://ifzq.gtimg.cn/appstock/app/kline/mkline?param={code},m15,,10000',
    prop: 'm15'
  },

  {
    span: 'MINUTE30',
    key: 'minute30',
    url: 'http://ifzq.gtimg.cn/appstock/app/kline/mkline?param={code},m30,,10000',
    prop: 'm30'
  },

  {
    span: 'MINUTE60',
    key: 'minute60',
    url: 'http://ifzq.gtimg.cn/appstock/app/kline/mkline?param={code},m60,,10000',
    prop: 'm60'
  },

  {
    span: 'MONTH',
    key: 'month',
    url: 'http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={code},month,,,320,qfq',
    prop: 'qfqmonth'
  },

  {
    span: 'WEEK',
    key: 'week',
    url: 'http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={code},week,,,320,qfq',
    prop: 'qfqweek'
  },

  {
    span: 'DAY',
    key: 'day',
    url: 'http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={code},day,,,10000,qfq',
    prop: 'qfqday',
    time: time => {
      time = new Date(time)

      const right = [
        time.getMonth() + 1,
        time.getDate()
      ].map(padNumber).join('-')

      return `${time.getFullYear()}-${right}`
    }
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


class Loader {
  constructor (code) {
    this._code = code.toLowerCase()
    this._cache = {}
  }

  async get ({time, span}) {
    if (!span) {
      return Promise.reject(new Error('span should be specified.'))
    }

    const cached = this._cache[span]

    // Nothing in the cache
    if (!cached) {
      return this._fetch({time, span})
    }

    const {
      value,
      data_too_old
    } = this._parse(cached, span, time)

    // Data found
    if (value) {
      return value
    }

    // If the cached data is too old, fetch new data
    if (data_too_old) {
      return this._fetch({time, span})
    }
  }

  _fetch ({time, span}) {
    return queue.add({
      span,
      code: this._code
    })
    .then(data => {
      console.log('data', data)
      const url = PRESET_MAP[span].url
      this._cache[span] = data

      return this._parse(data, span, time).value
    })
  }

  // used by
  _parse (data, span, time) {
    const preset = PRESET_MAP[span]

    // m5 queue has no params
    const stock_time = preset.time(time)
    const candlesticks = data.data[this._code][preset.prop]

    const index = candlesticks.findIndex((item) => {
      return item[0] === stock_time
    })

    if (!~index) {
      const [latest_time] = candlesticks[candlesticks.length - 1]
      return {
        data_too_old: + latest_time < + stock_time
      }
    }

    const found = candlesticks[index]

    const [
      ,
      open,
      close,
      high,
      low,
      volume
    ] = found

    return {
      value: {
        time,
        open,
        close,
        high,
        low,
        volume
      }
    }
  }
}


function padNumber (number) {
  return padStart('' + number, 2, '0')
}


module.exports = Loader
