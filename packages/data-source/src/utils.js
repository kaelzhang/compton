import concat from 'lazy-concat'
import {
  Second,
  Minute,
  Minute5,
  Minute15,
  Minute30,
  Minute60,
  Day,
  Week,
  Month
} from 'time-spans'

const TIME_SPANS_MAP = {
  'SECOND'  : Second,
  'MINUTE'  : Minute,
  'MINUTE5' : Minute5,
  'MINUTE15': Minute15,
  'MINUTE30': Minute30,
  'MINUTE60': Minute60,
  'DAY'     : Day,
  'WEEK'    : Week,
  'Month'   : Month
}


export const Time = (time: Date, span) => {
  const Klass = TIME_SPANS_MAP[span]
  return new Klass(time)
}

export const compose = concat.factory({
  equal: ({time}, {time: time2}) => + time === + time2
})
