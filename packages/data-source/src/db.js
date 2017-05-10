const knex = require('knex')
const queue = require('ready-queue')
const {candlestick} = require('./schema')

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


class Client {
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


module.exports = Client
