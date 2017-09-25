import test from 'ava'
import Loader from '../src'


const code = 'sz002239'
const only = true

const getTest = (test, only) => only
  ? test.only
  : test

;[
  {
    span: 'DAY',
    date: [2017, 6, 25],
    expect: [
      // open, close, high, low
      4.07,
      4.24,
      4.27,
      4.04,
      157484
    ]
  },

  {
    span: 'WEEK',
    date: [2017, 4, 12],
    expect: [
      4.409,
      4.104,
      4.438,
      3.919,
      172604
    ]
  },

  {
    span: 'MONTH',
    date: [2017, 8, 25],
    expect: [
      "4.100","4.72","5.870","3.990","14537877"
    ]
  },
  {
    span: 'MINUTE60',
    date: [2017, 8, 4, 11, 30],
    expect: [
      "4.07","4.07","4.07","4.05","18175.00"
    ]
  }
]
.forEach(({
  span,
  date,
  expect,
  only
}) => {

  getTest(test, only)(span, async t => {
    const loader = new Loader(code)

    const {
      open,
      close,
      high,
      low,
      volume
    } = await loader.get({
      time: new Date(...date),
      span
    })

    t.deepEqual([
      open,
      close,
      high,
      low,
      volume
    ], expect.map(Number))
  })
})
