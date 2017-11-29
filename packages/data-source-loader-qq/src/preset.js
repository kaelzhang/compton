import range from 'lodash.range'
import padStart from 'lodash.padstart'
import moment from 'moment'

const date = d => new Date(d)
const padNumber = number => padStart('' + number, 2, '0')

const dayString = time => moment(time).format('YYYY-MM-DD')
const minuteString = time => moment(time).format('YYYYMMDDHHmm') + '00'
const parseMinute = timestring => moment(timestring, 'YYYYMMDDHHmm').toDate()
const parseDay = timestring => moment(timestring, 'YYYY-MM-DD').toDate()

const sub4Months = (time: Moment) =>
  time.subtract(4, 'M').date(0).hours(0).minutes(0)

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
    // Trading hours in 4 months: 4 * (31 / 7 * 5) * 4 ~~= (<) 360
    url: (code, [, before = '']) =>
      `http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=${code},m60,${before},360`,
    prop: 'm60',
    formatTime: minuteString,
    parseTime: parseMinute,
    // Into
    map ([from: Date, to: Date]) {
      to = to || new Date

      const before = moment(to).add(1, 'M').date(0).hours(0)
      let b = before
      const ranges = []

      do {
        ranges.unshift([, minuteString(b)])
        b = sub4Months(b)
      } while (b > Date)

      return ranges
    }
  },

  // DAY
  /////////////////////////////////////////////////////////////////////////////
  DAY: {
    // [from, to] is a left-close and right-close region
    url: (code, [from = '', to = ''], limit = 320) =>
      `http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},day,${from},${to},${limit},qfq`,
    // The key of the response data
    prop: 'qfqday',

    // Transform request time -> response time format
    // Date -> 2017-09-01
    formatTime: dayString,
    parseTime: parseDay,
    // Splits time ranges into each year
    map ([from: Date, to: Date]): Array<string> {
      to = to || new Date
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
