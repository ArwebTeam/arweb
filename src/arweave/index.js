'use strict'

const Arweave = require('arweave/web').default
const {fetchJSONCache, fetchJSONFallbackCache} = require('./cache')

module.exports = async (config) => {
  const a = Arweave.init(config)

  const TXIDs = await caches.open('arweaveTXIDs')
  const arql = await caches.open('arweaveARQL')

  const makeUrl = (url) => `${config.protocol}://${config.host}:${config.port}/${url}`
  const doFetch = (url, conf) => fetch(makeUrl(url), conf)
  const makeRequest = (url, conf) => new Request(makeUrl(url), conf)
  const postJSON = (data) => {
    return {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  }

  return {
    arql: async (query) => fetchJSONFallbackCache(
      makeRequest('arql', postJSON(query)),
      arql),

    ar: a.ar,
    wallets: {
      generate: a.wallets.generate.bind(a),
      jwkToAddress: a.wallets.jwkToAddress.bind(a)

    },

    createTransaction: a.createTransaction.bind(a),
    transactions: {
      sign: a.transactions.sign.bind(a),
      get: async (id) => fetchJSONCache(
        makeRequest(`tx/${id}`),
        TXIDs
      )
    }
  }
}
