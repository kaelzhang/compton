import knex from 'knex'
import queue from 'ready-queue'
import map from 'array-map-sorted'

import {
  candlestick
} from './schema'
import Time from './time'


// There is not a good way to detect knex instance
const isKnex = knex => {
  return knex && typeof knex.select === 'function'
}

export default class Client {
  constructor ({
    client,
    connection,
    code,
    span
  }) {

    this._code = code
    this._span = span

    this._client = isKnex(connection)
      ? connection
      : knex({
        client,
        connection
      })

    this._tableName = `${this._span}_${this._code}`
    this._createDataTable = queue({
      load: span => this._prepareTable(span)
    })

    this._tableNameUpdated = 'updated_to'
    this._createLatestUpdatedTable = queue({
      load: () => this._prepareStatusTable()
    })

    this._isReady = {}
  }

  // Left-closed and right-closed
  async between ([from, to]) {
    const rows = await this._client
    .select()
    .from(this._tableName)
    .whereBetween('time', [from, to])

    return Promise.all(rows.map(candlestick))
  }

  // Get the last updated time
  async lastUpdated () {
    await this._updatedReady()

    const rows = await this._client
    .select('updated_to')
    .from(this._tableNameUpdated)
    .where({
      code: this._code
      span: this._span
    })

    if (!rows.length) {
      return new Date(0)
    }

    return new Date(rows[0])
  }

  // Update the last updated time
  async updated (time) {
    await this._updatedReady()
    
    const code = this._code
    const span = this._span
    const name = this._tableNameUpdated
    const client = this._client

    return client(name).insert(
      client.select(code, span, time)
      .whereNotExists(
        client(name)
        .select('code', 'span', 'updated_to')
        .where({
          code,
          span
        })
      )
    )
  }

  // Only save candlestick that is closed
  // TODO: BUG:
  // should detect if the stock market is closed.
  validate (time, value) {
    return value && time && Time(time, this._span).timestamp() === + time
  }

  // Get the candlestick from db
  // @returns `Candlestick`
  get (time) {
    return this._ready()
    .then(() => this._get(time))
  }

  mget (...times) {
    return this._ready()
    .then(() => this._mget(times))
  }

  set (time, value) {
    return this._ready()
    .then(() => this._set(time, value))
  }

  mset (...pairs) {
    return this._ready()
    .then(() => this._mset(pairs))
  }

  _ready () {
    return this._createDataTable.add()
  }

  _updatedReady () {
    return this._prepareStatusTable.add()
  }

  _prepareStatusTable () {
    const schema = this._client.schema
    const name = this._tableNameUpdated

    return schema.hasTable(name).then(exists => {
      if (exists) {
        return
      }

      return schema
      .createTableIfNotExists(name, table => {
        table.increments('id').primary()
        table.string('code', 10)
        table.enu('span', [
          'DAY',
          'WEEK',
          'MINUTE60'
        ])
        table.dateTime('updated_to')
      })
    })
  }

  _prepareTable () {
    const schema = this._client.schema
    const name = this._tableName

    return schema.hasTable(name).then(exists => {
      if (exists) {
        return
      }

      // If no
      Promise.all([
        this._createTable(name),
        // create or update other records
      ])
    })
  }

  // CREATE TABLE day_sz002239 (
  //   id INTEGER NOT NULL AUTO_INCREMENT,
  //   open FLOAT(7, 2) NOT NULL,
  //   high FLOAT(7, 2) NOT NULL,
  //   low FLOAT(7, 2) NOT NULL,
  //   close FLOAT(7, 2) NOT NULL,
  //   volumn INTEGER UNSIGNED NOT NULL,
  //   time DATETIME NOT NULL,
  //   PRIMARY KEY (id)
  // )
  _createTable (name) {
    return this._client
    .schema
    .createTableIfNotExists(name, table => {
      table.increments('id').primary()
      table.float('open',   8, 3)
      table.float('high',   8, 3)
      table.float('low',    8, 3)
      table.float('close',  8, 3)
      table.integer('volume').unsigned()
      table.dateTime('time')
    })
  }

  _get (time) {
    return this._client
    .select()
    .from(this._tableName)
    .where('time', new Date(time))
    .then(rows => {
      const row = rows[0]
      if (row) {
        return candlestick(row)
      }
    })
  }

  _mget (times) {
    let matchedIndex = -1

    return this._client
    .select()
    .from(this._tableName)
    .whereIn('time', times)
    .then(rows => {
      const tasks = map(
        times,
        rows,
        (time, row) => + row.time === + time,
        (time, row) => candlestick(row)
      )

      return Promise.all(tasks)
    })
  }

  _set (time, value) {
    return this._client(this._tableName)
    .insert(write_value(value))
  }

  _mset (pairs) {
    return this._client(this._tableName)
    .insert(pairs.map(([, value]) => write_value(value)))
  }
}


function write_value (value) {
  const {
    open,
    high,
    low,
    close,
    volume,
    time
  } = value

  return {
    open,
    high,
    low,
    close,
    volume,
    time: new Date(time)
  }
}
