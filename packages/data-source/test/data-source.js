const CODE = 'sz002239'
const DATE = new Date(2017, 4, 5)

import test from 'ava'
import knex from 'knex'

import DataSource from '../src'
import Loader from 'data-source-loader-qq'

import {
  Candlesticks
} from 'candlesticks'

import request from 'request'

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

  const span = source.span('DAY')

  const singleResult = await span.get(DATE)

  console.log('single result', singleResult)

  const betweenResult = await span.between([
    new Date(2017, 6, 2), new Date(2017, 6, 5)
  ])

  console.log('between result', betweenResult)
})

test.only('sync', async t => {
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

  await source.span('DAY').sync([new Date('2007-01-01')])
})
