import range from 'lodash.range'
import padStart from 'lodash.padstart'

const date = d => new Date(d)
const padNumber = number => padStart('' + number, 2, '0')

const dayString = time => {
  const right = [
    time.getMonth() + 1,
    time.getDate()
  ].map(padNumber).join('-')

  return `${time.getFullYear()}-${right}`
}

const minuteString = time => {
  const right = [
    time.getMonth() + 1,
    time.getDate(),
    time.getHours(),
    time.getMinutes()
  ].map(padNumber).join('')

  return `${time.getFullYear()}${right}`
}

const parseMinute = timestring => {
  const [
    Y, M, D,
    h, m
  ] = timestring.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/).slice(1)

  return new Date(Y, M - 1, D, h, m)
}

const parseDay = timestring => {
  const [Y, M, D] = timestring.split('-')
  return new Date(Y, M - 1, D)
}

export default {
  // MINUTE5: {
  //   key: 'minute5',
  //   url: code => `http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=${code},m5,,10000`,
  //   prop: 'm5',
  //   formatTime: minuteString,
  //   parseTime: parseMinute
  // },
  //
  // MINUTE15: {
  //   key: 'minute15',
  //   url: code =>  `http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=${code},m15,,10000`,
  //   prop: 'm15',
  //   formatTime: minuteString,
  //   parseTime: parseMinute
  // },
  //
  // MINUTE30: {
  //   key: 'minute30',
  //   url: code =>  `http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=${code},m30,,10000`,
  //   prop: 'm30',
  //   formatTime: minuteString,
  //   parseTime: parseMinute
  // },
  //
  MINUTE60: {
    url: (code, [from = '', to = '']) =>
      `http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=${code},m60,,`,
    prop: 'm60',
    formatTime: minuteString,
    parseTime: parseMinute,
    map ([from, to]) {

    }
  },

  // DAY
  /////////////////////////////////////////////////////////////////////////////
  DAY: {
    // [from, to] is a left-close and right-close region
    url: (code, [from = '', to = ''], limit = 320) =>
      `http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},day,${from},${to},${limit},qfq`
    },
    // The key of the response data
    prop: 'qfqday',

    // Transform request time -> response time format
    // Date -> 2017-09-01
    formatTime: dayString,
    parseTime: parseDay,
    // Splits time ranges into each year
    map ([from, to]): Array<string> {
      [from, to] = [from, to].map(date)

      const fromYear = from.getFullYear()
      let toYear = fromYear

      while (new Date(String(toYear + 1)) <= to) {
        toYear ++
      }

      return range(fromYear, toYear + 1).map(year => [
        `${year}-01-01`,
        `${year}-12-31`
      ])
    }
  },

  // WEEK: {
  //   key: 'week',
  //   url: code =>  `http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},week,,,320,qfq`,
  //   prop: 'qfqweek',
  //   // match: (time, record_time) =>
  //     // new Week(time).inSamePeriod(record_time)
  //   formatTime: dayString,
  //   parseTime: parseDay
  // },
  //
  // MONTH: {
  //   key: 'month',
  //   url: code =>
  //   `http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?_var=kline_monthqfq&param=${code},month,,,320,qfq`,
  //   prop: 'qfqmonth',
  //   formatTime: dayString,
  //   parseTime: parseDay,
  //   replace: string => string.replace(/^kline_monthqfq=/, '')
  // }
}
