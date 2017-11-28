//  date            open    close   high    low     volume
// ["201609300935","9.960","9.950","9.990","9.940","1164.000"]

// referrer
// http://gu.qq.com/sz300131?pgv_ref=fi_smartbox&_ver=2.0

// req:
// http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=sz300131,m5,,320&_var=m5_today&r=0.23718283001260598

// suspension
// http://stockjs.finance.qq.com/sstock/list/suspension/js/sz000829.js?0.9345282303402396

import PRESETS from './preset'
import Loader from './loader'

export default class {
  constructor (code, span) {
    if (!span) {
      return Promise.reject(new Error('span should be specified.'))
    }

    this._code = code.toLowerCase()
    this._loader = new Loader(code, PRESETS[span])
  }

  get (...times: Array<Date>) {
    const length = times.length

    if (length === 0) {
      return []
    }

    return this._mget(times)
    .then(data => length === 1
      ? data[0]
      : data)
  }

  async _mget (times) {
    return this._loader.get([times[0], times[times.length - 1]])
    .then(data => this._loader.find(data, [time]))
  }

  between ([from, to]) {
    return this._loader.get([from, to])
    .then(data => data.map(this._loader.formatDatum))
  }
}
