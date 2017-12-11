import queue from 'ready-queue'
import map from 'array-map-sorted'

import {
  candlestick
} from './schema'
// import Time from './time'

const returnTrue = () => true

export default class Client {
  constructor ({
    client,
    connection,
    code,
    span,
    // Function(time, span)
    validate = returnTrue
  }) {

    this._code = code
    this._span = span

    // Only save candlestick that is closed
    this.validate = validate

    this._client = connection

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
  async between ([from: Date, to: Date]) {
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
      code: this._code,
      span: this._span
    })

    if (!rows.length) {
      return new Date(0)
    }

    return new Date(rows[0].updated_to)
  }

  // Update the last updated time
  async updated (time: Date) {
    await this._updatedReady()

    const code = this._code
    const span = this._span
    const name = this._tableNameUpdated

    return this._client.raw(
      `INSERT INTO ${name} (code, span, updated_to) VALUES (?, ?, ?) ` +
      `ON DUPLICATE KEY UPDATE updated_to = ?`,
      [code, span, time, time]
    )
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
    return this._createLatestUpdatedTable.add()
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
        table.string('code', 10)
        .notNullable()
        .comment('stock code')

        table.enu('span', [
          'DAY',
          'WEEK',
          'MINUTE60'
        ])
        .notNullable()
        .comment('time interval')

        table.dateTime('updated_to')
        .comment('the latest updated date')

        table.timestamp('updated_at')
        .notNullable()
        .defaultTo(this._client.raw('CURRENT_TIMESTAMP'))

        // compound primary keys
        table.primary(['code', 'span'])
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

      return this._createTable(name)
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
      table.float('open',   8, 3).notNullable()
      table.float('high',   8, 3).notNullable()
      table.float('low',    8, 3).notNullable()
      table.float('close',  8, 3).notNullable()
      table.integer('volume').unsigned().notNullable()
      table.dateTime('time').unique().notNullable()

      table.timestamp('created_at')
      .notNullable()
      .defaultTo(this._client.raw('CURRENT_TIMESTAMP'))
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
    const sql = this._client(this._tableName)
    .insert(write_value(value))

    return this._client.raw(addIgnore(sql))
  }

  _mset (pairs) {
    if (!pairs.length) {
      return
    }

    const sql = this._client(this._tableName)
    .insert(pairs.map(([, value]) => write_value(value)))

    return this._client.raw(addIgnore(sql))
  }
}

// 'INSERT ...' -> 'INSERT IGNORE'
const addIgnore = sql => sql.toString().replace(/^insert/i, 'INSERT IGNORE')

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
