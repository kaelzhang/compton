const knex = require('knex')

class Client {
  constructor ({
    client,
    connection,
    code
  }) {

    this._client = knex({
      client,
      connection
    })

    this._code = code
  }

  get ({
    span,
    time
  }) {

    return this._client
    .select()
    .from(`day_${this._code}`)
    .where('time', time)
  }

  set ({
    value,
    span,
    time
  }) {

    return this._client(`day_${this._code}`)
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
    time
  }
}


module.exports = Client
