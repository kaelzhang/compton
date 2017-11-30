export default class {
  constructor (db) {
    this._db = db
    this._lastUpdated = null
  }

  async updated (time) {
    await this._db.updated(time)
    this._lastUpdated = time
  }

  async lastUpdated () {
    return this._lastUpdated || await this._db.lastUpdated()
  }
}
