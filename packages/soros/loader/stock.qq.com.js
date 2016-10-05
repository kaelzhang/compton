const request = require('request')
const queue = require('../lib/load-queue')
const padStart = require('lodash.padstart')
const {
  TIME_SPANS
} = require('data-source')


//  date            open    close   high    low     volume
// ["201609300935","9.960","9.950","9.990","9.940","1164.000"]

// referrer
// http://gu.qq.com/sz300131?pgv_ref=fi_smartbox&_ver=2.0

// req:
// http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=sz300131,m5,,320&_var=m5_today&r=0.23718283001260598

class Loader {
  constructor (code) {
    this._code = code = code.toLowerCase()

    this._m5queue = queue({
      load: () => {
        return new Promise((resolve, reject) => {
          request({
            url: `http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=${code},m5,,10000`,
            headers: {
              'Referrer': `http://gu.qq.com/${code}?pgv_ref=fi_smartbox&_ver=2.0`,
              'Host': 'ifzq.gtimg.cn',
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
  }

  load (time, span) {
    if (!span) {
      throw new Error('span should be specified.')
    }

    if (span === TIME_SPANS.MINUTE5) {
      return this._loadM5(time)
    }
  }

  // used by
  _loadM5 (time) {
    // m5 queue has no params
    return this._m5queue
      .add()
      .then((data) => {
        const stockTime = this._transformTime(time)
        const m5s = data.data[this._code].m5

        const index = m5s.findIndex((item) => {
          return item[0] === stockTime
        })

        if (!~index) {
          return Promise.resolve(null)
        }

        const found = m5s[index]
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


module.exports = Loader
