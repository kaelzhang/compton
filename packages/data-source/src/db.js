import knex from 'knex'
import queue from 'ready-queue'

import {
  candlestick
} from './schema'
import Time from './time'

export default class Client {
  constructor ({
    client,
    connection,
    code
  }) {

    this._code = code

    this._client = knex({
      client,
      connection
    })

    this._queue = queue({
      load: span => this._prepare_table(span)
    })
  }

  // Get the candlestick from db
  // @returns `Candlestick`
  get ({
    span,
    time
  }) {

    return this._queue.add(span)
    .then(
      () => this._get({
        span,
        time
      })
    )
  }

  set ({
    span,
    time
  }, value) {

    return this._queue.add(span)
    .then(
      () => this._set({
        span,
        time
      }, value)
    )
  }

  // Only save time that is 
  validate ({span, time}) {
    return Time(time, span).timestamp() === + time
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

  _set ({
    span,
    time
  }, value) {

    return this._client(`${span}_${this._code}`)
    .insert(write_value(value))
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
