'use strict'

const { openDB } = require('idb')
const { kv } = require('idb-shared-kv')
const Caching = require('itz-caching-time')

const Account = require('./account')
const Config = require('./config')
const Profile = require('./profile')

module.exports = async ({account, config, profile} = {}, {arweave}) => {
  const db = await openDB('user', 1, {
    upgrade (db, oldVersion, newVersion, transaction) {
      db.createObjectStore('conf')
      db.createObjectStore('cache')
    }
  })

  const conf = kv(db, 'conf')
  const cacheDB = kv(db, 'cache')
  const cache = await Caching({ storage: cacheDB })

  const p = {conf, cache, arweave}

  return {
    account: await Account(account, p),
    config: await Config(config, p),
    profile: await Profile(profile, p)
  }
}
