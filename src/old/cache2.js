'use strict'

// const {flatten, unflatten} = require('flatten-unflatten')

const dset = require('dlv')
const dget = require('dget')

const Dexie = require('dexie').default

const overrideFunctions = () => {
  arql: (orig, ...a) => {

  }
}

module.exports = async () => {
  const db = new Dexie('arweaveOfflineCache')
  db.version(1).stores({
    arwaveTXID: 'id,val'
  })

  return {
    arweave: (a) => {
    }
  }
}
