import test from 'ava'
import Loader from '../src'


const code = 'sz002239'

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
  }
]
.forEach(({
  span,
  date,
  expect
}) => {

  test(span, async t => {
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
    ], expect)
  })
})
