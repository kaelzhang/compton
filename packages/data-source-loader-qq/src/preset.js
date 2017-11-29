import range from 'lodash.range'
import padStart from 'lodash.padstart'
import moment from 'moment'

const date = d => new Date(d)
const padNumber = number => padStart('' + number, 2, '0')

const dayString = time => moment(time).format('YYYY-MM-DD')
const minuteString = time => moment(time).format('YYYYMMDDHHmm') + '00'
const parseMinute = timestring => moment(timestring, 'YYYYMMDDHHmm').toDate()
const parseDay = timestring => moment(timestring, 'YYYY-MM-DD').toDate()

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

// Period: 4 months
export const MINUTE60 = {
  // Trading hours in 4 months: 4 * (31 / 7 * 5) * 4 ~~= (<) 360
  url (code, [, before = ''], limit = 360) {
    return `http://ifzq.gtimg.cn/appstock/app/kline/mkline?param=${code},m60,${before},${limit}`
  },
  prop: 'm60',
  formatTime: minuteString,
  parseTime: parseMinute,
  closest (to) {
    const nextQDate = moment(to).add(4, 'M')
    const monthsToSub = nextQDate.month() % 4
    return nextQDate
    .subtract(monthsToSub, 'M')
    .date(0)
    .hours(0)
    .minutes(0)
    .seconds(0)
    .milliseconds(0)
  },
  stepBack (moment) {
    return moment.subtract(4, 'M')
  },
  // Into
  map ([from: Date, to: Date]) {
    to = to || new Date
    const before = MINUTE60.closest(to)
    const ranges = []

    do {
      ranges.unshift([, MINUTE60.formatTime(before)])
      MINUTE60.stepBack(before)
    } while (before > from)

    return ranges
  }
}

// Period: 1 year
export const DAY = {
  // [from, to] is a left-close and right-OPEN region
  url: (code, [from = '', before = ''], limit = 320) =>
    `http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},day,${from},${before},${limit},qfq`,
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
      `${year + 1}-01-01`
    ])
  }
}

// Period: 6 years, 6 * 54 = 324 < 340
export const WEEK = {
  key: 'week',
  url: (code, [from = '', before = ''], limit = 340) =>  `http://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},week,${from},${before},${limit},qfq`,
  prop: 'qfqweek',
  formatTime: dayString,
  parseTime: parseDay,
  closest (to) {
    return moment(to).add(1, 'y')
    .month(0)
    .day(5)
    .hours(0)
    .minutes(0)
    .seconds(0)
    .milliseconds(0)
  },
  stepBack (moment) {
    return moment.subtract(6 * 54, 'w')
  },
  map ([from: Date, to: Date]) {
    to = to || new Date
    const before = WEEK.closest(to)
    const ranges = []
    let formated

    do {
      formated = WEEK.formatTime(before)
      WEEK.stepBack(before)
      ranges.unshift([WEEK.formatTime(before), formated])
    } while (before > from)

    return ranges
  }
}

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
