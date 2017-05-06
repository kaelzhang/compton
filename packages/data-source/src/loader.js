const request = require('request')
const node_url = require('url')
const queue = require('../lib/load-queue')
const padStart = require('lodash.padstart')
const {
  TIME_SPAN: {
    MONTH,
    WEEK,
    DAY,
    MINUTE60,
    MINUTE30,
    MINUTE15,
    MINUTE5,
    MINUTE,
    SECOND
  }
} = require('data-source')


//  date            open    close   high    low     volume
// ["201609300935","9.960","9.950","9.990","9.940","1164.000"]

// referrer
// http://gu.qq.com/sz300131?pgv_ref=fi_smartbox&_ver=2.0

// req:
// http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=sz300131,m5,,320&_var=m5_today&r=0.23718283001260598

// suspension
// http://stockjs.finance.qq.com/sstock/list/suspension/js/sz000829.js?0.9345282303402396


function loadData ({
  url,
  code
}) {
  return queue({
    load: () => new Promise((resolve, reject) => {
      request({
        url: url.replace('{code}', code),
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

  })
}


const PRESETS = [
  {
    span: MINUTE5,
    key: 'minute5',
    url: 'http://ifzq.gtimg.cn/appstock/app/kline/mkline?param={code},m5,,10000',
    prop: 'm5'
  },

  {
    span: MINUTE15,
    key: 'minute15',
    url: 'http://ifzq.gtimg.cn/appstock/app/kline/mkline?param={code},m15,,10000',
    prop: 'm15'
  },

  {
    span: MINUTE30,
    key: 'minute30',
    url: 'http://ifzq.gtimg.cn/appstock/app/kline/mkline?param={code},m30,,10000',
    prop: 'm30'
  },

  {
    span: MINUTE60,
    key: 'minute60',
    url: 'http://ifzq.gtimg.cn/appstock/app/kline/mkline?param={code},m60,,10000',
    prop: 'm60'
  },

  {
    span: MONTH,
    key: 'month',
    url: 'http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={code},month,,,320,qfq',
    prop: 'qfqmonth'
  },

  {
    span: WEEK,
    key: 'week',
    url: 'http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={code},week,,,320,qfq',
    prop: 'qfqweek'
  },

  {
    span: DAY,
    key: 'day',
    url: 'http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param={code},day,,,10000,qfq',
    prop: 'qfqday'
  }
]

const PRESET_MAP = {}
PRESETS.forEach((preset) => {
  PRESET_MAP[preset.span] = preset
})


class Loader {
  constructor (code) {
    this._code = code = code.toLowerCase()

    // monthly
    this._queue = {}

    PRESETS.forEach((preset) => {
      this._queue[preset.key] = loadData({
        url: preset.url,
        code
      })
    })
  }

  load (time, span) {
    if (!span) {
      throw new Error('span should be specified.')
    }

    const preset = PRESET_MAP[span]

    if (!preset) {
      throw new Error('invalid time span.')
    }

    return this._load(time, preset)
  }

  // used by
  _load (time, preset) {
    // m5 queue has no params
    return this._queue[preset.key]
      .add()
      .then((data) => {
        const stockTime = this._transformTime(time)
        const candlesticks = data.data[this._code][preset.prop]

        const index = candlesticks.findIndex((item) => {
          return item[0] === stockTime
        })

        if (!~index) {
          return Promise.resolve(null)
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

        return Promise.resolve({
          time,
          open,
          close,
          high,
          low,
          volume
        })
      })
  }

  // @param {Date} time
  _transformTime (time) {
    const right = [
      time.getMonth() + 1,
      time.getDate(),
      time.getHours(),
      time.getMinutes()
    ].map(padNumber).join('')

    return `${time.getFullYear()}${right}`
  }
}


function padNumber (number) {
  return padStart('' + number, 2, '0')
}


module.exports = {
  Loader
}
