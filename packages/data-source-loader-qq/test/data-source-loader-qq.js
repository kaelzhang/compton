import test from 'ava'
import Loader from '../src'


const code = 'sz002239'
const only = true

const getTest = (test, only) => only
  ? test.only
  : test

const CASES = [
  {
    span: 'DAY',
    date: [
      [2014, 2, 11],
      [2017, 6, 25],
    ],
    expect: [
      ["1.785","1.845","1.851","1.780","60654.000"],
      [
        // open, close, high, low
        4.07,
        4.24,
        4.27,
        4.04,
        157484
      ]
    ]
  },

  // {
  //   span: 'WEEK',
  //   date: [
  //     [2013, 4, 31],
  //     [2017, 4, 12]
  //   ],
  //   expect: [
  //     ["1.786","1.858","1.946","1.771","257293.000"],
  //     [
  //       4.409,
  //       4.104,
  //       4.438,
  //       3.919,
  //       172604
  //     ]
  //   ]
  // },
  //
  // {
  //   span: 'MONTH',
  //   date: [
  //     [2013, 8, 30],
  //     [2017, 7, 31]
  //   ],
  //   expect: [
  //     ["1.640","1.630","1.710","1.595","377551.000"],
  //     ["4.180","4.090","4.620","4.080","1998668.000"]
  //   ]
  // },
  // {
  //   span: 'MINUTE60',
  //   date: [
  //     [2017, 7, 11,11, 30],
  //     [2017, 8, 4, 11, 30]
  //   ],
  //   expect: [
  //     ["4.14","4.12","4.15","4.12","9066.00"],
  //     ["4.07","4.07","4.07","4.05","18175.00"]
  //   ]
  // },
  // {
  //   span: 'MINUTE5',
  //   date: [
  //     [2017, 8, 22, 11],
  //     [2017, 8, 22, 14, 55]
  //   ],
  //   expect: [
  //     ["5.12","5.11","5.13","5.10","9963.00"],
  //     ["5.05","5.04","5.05","5.03","33051.00"]
  //   ]
  // },
  // {
  //   span: 'MINUTE15',
  //   date: [
  //     [2017, 8, 18, 14, 45],
  //     [2017, 8, 20, 10, 15]
  //   ],
  //   expect: [
  //     ["5.20","5.22","5.25","5.20","60925.00"],
  //     ["5.14","5.10","5.15","5.07","94924.00"]
  //   ]
  // },
  // {
  //   span: 'MINUTE30',
  //   date: [
  //     [2017, 8, 19, 11],
  //     [2017, 8, 25, 15]
  //   ],
  //   expect: [
  //     ["5.38","5.30","5.38","5.30","212008.00"],
  //     ["4.73","4.72","4.76","4.69","95746.00"]
  //   ]
  // }
]


const mget = true

function run (index) {
  CASES.forEach(({
    span,
    date,
    expect,
    only
  }) => {

    getTest(test, only)(`${span}[${index}]`, async t => {
      const loader = new Loader(code)

      const {
        open,
        close,
        high,
        low,
        volume
      } = await loader.get({
        time: + new Date(...date[index]),
        span
      })

      t.deepEqual([
        open,
        close,
        high,
        low,
        volume
      ], expect[index].map(Number))
    })
  })
}

run(0)
run(1)

mget && CASES.forEach(({
  span,
  date,
  expect,
  only
}) => {

  getTest(test, only)(`${span}:mget`, async t => {
    const loader = new Loader(code)

    const results = await loader.mget(...date.map(d => {
      return {
        time: + new Date(...d),
        span
      }
    }))

    const cleaned = results.map(({
      open,
      close,
      high,
      low,
      volume
    }) => [
      open,
      close,
      high,
      low,
      volume
    ])

    t.deepEqual(cleaned, expect.map(datum => datum.map(Number)))
  })
})
