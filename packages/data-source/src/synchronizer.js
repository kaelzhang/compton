export default class {
  constructor (db, loader) {
    this._db = db
    this._loader = loader
    this._lastUpdated = null
  }

  async updated (time) {
    await this._db.updated(time)
    this._lastUpdated = time
  }

  async lastUpdated () {
    return this._lastUpdated || await this._db.lastUpdated()
  }

  sync ([from, to]) {
    return this._loader.between([from, to])
  }
}
