'use strict'

// TODO: static resources

global.DEBUG = true

require('..')({
  app: {
    id: 'io.mkg20001.arweave-example'
  },
  arweave: {
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  }/*,
  api: {
    mainBlock: 'BLOCKID'
  } */
}).then(a => {

})
