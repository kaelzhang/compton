import moment from 'moment'

const isSameDay = (time, current) => {
  return time.getFullYear() === current.getFullYear()
  && time.getMonth() === current.getMonth()
  && time.getDate() === current.getDate()
}

const isAfterTradingTime = current => {
  const Y = current.getFullYear()
  const M = current.getMonth()
  const D = current.getDate()

  return + current > + new Date(Y, M, D, 15)
}

const MINUTE_SPANS = 'MINUTE5 MINUTE15 MINUTE30 MINUTE60'.split(' ')
const shouldTestTradingTime = span => !!~ MINUTE_SPANS.indexOf(span)

const BIG_SPANS = 'MONTH WEEK'.split(' ')
const largerThanDay = span => !!~ BIG_SPANS.indexOf(span)


export const isClosed = (time, span) => {
  const current = new Date

  switch (span) {
    case 'DAY':
      return isSameDay(time, current)
        ? isAfterTradingTime(current)
        : current > time

    case 'WEEK':
      return isSameDay(time, current)
        // is friday and closed
        ? current.getDay() === 5 && isAfterTradingTime(current)
        // is larger than the friday of the week that `time` belongs to
        : current > moment(time).day(5)

    case 'MONTH':
      // TODO: use false for now, it will not harm
      return false

    default:
      return time > time
  }
}
