'use strict'

// TODO: static resources

global.DEBUG = true

const arweb = require('..')

arweb.sw({
  app: {
    id: 'io.mkg20001.arweave-example'
  },
  arweave: {
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  },
  static: {
    provider: arweb.static.arweave,
    config: {
      address: 'addr',
      app: 'arweave-example'
    }
  }
  /*,
  api: {
    mainBlock: 'BLOCKID'
  } */
}).then(a => {
  require('./generated')(a).then(() => {

  })
})
