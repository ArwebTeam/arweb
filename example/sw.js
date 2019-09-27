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

    }
  }
  /*,
  api: {
    mainBlock: 'BLOCKID'
  } */
}).then(a => {
})
