const {
  Second,
  Minute,
  Minute5,
  Minute15,
  Minute30,
  Minute60,
  Day,
  Week,
  Month
} = require('time-spans')

const MONTH = Symbol('Month')
const WEEK = Symbol('week')
const DAY = Symbol('day')
const MINUTE60 = Symbol('minute60')
const MINUTE30 = Symbol('minute30')
const MINUTE15 = Symbol('minute15')
const MINUTE5 = Symbol('minute5')
const MINUTE = Symbol('minute')
const SECOND = Symbol('second')

const AVAILABLE_TIME_SPANS = [
  MONTH,
  WEEK,
  DAY,
  MINUTE60,
  MINUTE30,
  MINUTE15,
  MINUTE5,
  MINUTE,
  SECOND
]


const Constructor = {
  [MONTH]: Month,
  [WEEK]: Week,
  [DAY]: Day,
  [MINUTE60]: Minute60,
  [MINUTE30]: Minute30,
  [MINUTE15]: Minute15,
  [MINUTE5]: Minute5,
  [MINUTE]: Minute,
  [SECOND]: Second
}


const TIME_SPAN = {
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


function Time (time, span) {
  const Class = Constructor[span]

  return new Class(time)
}


module.exports = {
  Time,
  TIME_SPAN,
  AVAILABLE_TIME_SPANS
}
