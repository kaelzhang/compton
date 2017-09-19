const CODE = 'sz002239'
const DATE = new Date(2017, 4, 5)

import test from 'ava'
import knex from 'knex'

import DataSource from '../src'
import Loader from 'data-source-loader-qq'

import {
  Candlesticks
} from 'candlesticks'


test('nothing...', async t => {

  const connection = knex({
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      user: 'kael',
      password: '123456',
      database: 'compton'
    }
  })

  const source = new DataSource({
    connection,
    code: CODE,
    loader: Loader,
    isTrading: (date) => {
      const day = new Date(date).getDay()
      return day !== 0 && day !== 6
    }
  })


  const singleResult = await source.get({
    span: 'DAY',
    time: + DATE
  })

  console.log('single result', singleResult)

  const betweenResult = await source.get({
    span: 'DAY',
    between: [ new Date(2017, 6, 2), + new Date(2017, 6, 5) ]
  })

  console.log('between result', betweenResult)

  // const latestResult = await source.get({
  //   span: 'DAY',
  //   latest: true
  // })
  //
  // console.log('latest result', latestResult)
  //
  // const fromResult = await source.get({
  //   span: 'DAY',
  //   between: [ + new Date(2017, 8, 15) ]
  // })
  //
  // console.log('from result', fromResult)
})
