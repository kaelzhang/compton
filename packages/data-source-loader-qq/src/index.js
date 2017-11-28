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
  constructor (code) {
    this._code = code.toLowerCase()
    this._loaders = Object.create(null)
  }

  _getLoader (span) {
    return this._loaders[span] || (
      this._loaders[span] = new Loader(code, PRESETS[span])
    )
  }

  async mget (...keys) {
    if (!keys.length) {
      return []
    }

    const {span} = keys[0]
    const loader = this._getLoader(span)

    const data = await loader.
  }

  async get ({
    // `timestamp`
    time,
    // `Enum.<DAY|...>`
    span,
    between
  }) {

    if (!span) {
      return Promise.reject(new Error('span should be specified.'))
    }

    if (!time && !between) {
      return Promise.reject(
        new Error('either time and between should be specified'))
    }

    const loader = this._getLoader(span)

    if (time) {
      const data = await loader.get(span, [time, time])
      return loader.find(time, data)
    }

    const data = await loader.add(span, between)
    return data.map(loader.formatDatum)
  }
}
