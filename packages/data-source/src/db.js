import knex from 'knex'
import queue from 'ready-queue'

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
    code
  }) {

    this._code = code

    this._client = isKnex(connection)
      ? connection
      : knex({
        client,
        connection
      })

    this._queue = queue({
      load: span => this._prepare_table(span)
    })

    this._isReady = {}
  }

  // Get the candlestick from db
  // @returns `Candlestick`
  get ({
    span,
    time
  }) {

    return this._ready(span)
    .then(
      () => this._get({
        span,
        time
      })
    )
  }

  mget (...keys) {
    return this._ready(keys[0].span)
    .then(() => this._mget(keys))
  }

  set ({
    span,
    time
  }, value) {

    return this._ready(span)
    .then(
      () => this._set({
        span,
        time
      }, value)
    )
  }

  mset (...pairs) {
    return this._ready(keys[0].span)
    .then(() => this._mset(pairs))
  }

  _ready (span) {
    if (this._isReady[span]) {
      return Promise.resolve()
    }

    return this._queue.add(span)
    .then(() => {
      this._isReady[span] = true
    })
  }

  // Only save candlestick that is closed
  validate ({span, time}, value) {
    return value && time && Time(time, span).timestamp() === + time
  }

  _prepare_table (span) {
    const schema = this._client.schema
    const name = `${span}_${this._code}`

    return schema.hasTable(name).then(exists => {
      if (exists) {
        return
      }

      // If no
      Promise.all([
        this._create_table(name),
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
  _create_table (name) {
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

  _get ({
    span,
    time
  }) {

    return this._client
    .select()
    .from(`${span}_${this._code}`)
    .where('time', new Date(time))
    .then(rows => {
      const row = rows[0]

      if (row) {
        return candlestick(row)
      }
    })
  }

  _mget (keys) {
    const {span} = keys[0]

    let matchedIndex = -1

    return this._client
    .select()
    .from(`${span}_${this._code}`)
    .whereIn('time', keys.map(({time}) => new Date(time)))
    .then(rows => {
      const results = keys.map(({time}) => {
        let i = matchedIndex + 1
        let row
        const length = rows.length

        for (; i < length; i ++) {
          row = rows[i]
          if (+ row.time === time) {
            matchedIndex = i
            return candlestick(row)
          }
        }
      })

      return Promise.all(results)
    })
  }

  _set ({
    span,
    time
  }, value) {

    return this._client(`${span}_${this._code}`)
    .insert(write_value(value))
  }

  _mset (pairs) {
    return this._client(`${span}_${this._code}`)
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
