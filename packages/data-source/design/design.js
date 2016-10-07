class TimeShare {
  // closed for the period of time
  closed: Boolean,
  open =,
  high =,
  low =,
  close =,
  volume =,
  time
}

enum TimeSpan {
  MINUTE,
  DAY,
  ...
}


dataSource
// 1
  .get({
    // 1 min
    span: TimeSpan.MINUTE

    // between, or time

    // might be changed according to span
    // [datetimeStart, datetimeEnd)
    between: [datetimeStart, datetimeEnd],
  })
  .then((candlesticks : Array<TimeShare>) => {

  })

// 2
  .get({
    span: TimeSpan.WEEK,
    time: + new Date
  })
  .then((candlestick: TimeShare) => {

  })

// 3
  .set({
    value: candlestick,
    span: TimeSpan.WEEK,
    time: + new Date
  })
  .then(() => {
    // success
  })
  .catch((err) => {
    // if exists, it will fail
  })

// 4
  .update({
    value: candlestick,
    span: TimeSpan.DAY,
    time: + new Date
  })
  .catch((err) => {
    // if not exists, it will fail
  })
