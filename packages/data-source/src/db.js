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
    .insert(value)
  }
}


module.exports = Client
