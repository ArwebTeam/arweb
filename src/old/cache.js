'use strict'

const Dexie = require('dexie').default

class ArweaveCache extends Dexie {
  constructor (name = 'arweaveCache') {
    super(name)
    const db = this

    db.version(1).stores({
      aliases: '&alias, &txId',
      queryResults: '&queryHash, time'
    })
  }
}

module.exports = ArweaveCache
