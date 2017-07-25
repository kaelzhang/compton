const test = require('ava')
const Loader = require('../src')

test('basic', async t => {
  const loader = new Loader('sz002239')

  const {
    open,
    close,
    high,
    low,
    volume
  } = await loader.get({
    time: new Date(2017, 6, 25),
    span: 'DAY'
  })

  t.deepEqual([
    open,
    close,
    high,
    low,
    volume
  ], [
    // open, close, high, low
    4.07,
    4.24,
    4.27,
    4.04,
    157484
  ].map(Number))
})
