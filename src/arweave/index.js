'use strict'

const Arweave = require('arweave/web').default
const {fetchJSONCache, fetchJSONFallbackCache} = require('./cache')

const Transaction = require('arweave/web/lib/transaction').default
const ArweaveError = require('arweave/web/lib/error').default

module.exports = async (config) => {
  const a = Arweave.init(config)

  const TXIDs = await caches.open('arweaveTXIDs')
  const arql = await caches.open('arweaveARQL')

  const makeUrl = (url) => `${config.protocol}://${config.host}:${config.port}/${url}`
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
    arql: async (query) => {
      let {data, req, res, isFresh} = await fetchJSONFallbackCache(
        makeRequest('arql', postJSON(query)),
        arql)

      // TODO: integrate arswarm layer

      if (data && isFresh) {
        await arql.put(req, res)
      } else if (!data) {
        data = []
      }

      return {
        data,
        live: isFresh
      }
    },

    ar: a.ar,
    wallets: {
      generate: a.wallets.generate.bind(a.wallets),
      jwkToAddress: a.wallets.jwkToAddress.bind(a.wallets),
      getBalance: async (address) => {
        const res = await fetch(makeRequest(`wallet/${address}/balance`))
        return res.text()
      },
      getLastTransactionID: async (address) => {
        const res = await fetch(makeRequest(`wallet/${address}/last_tx`))
        return res.text()
      }
    },

    createTransaction: a.createTransaction.bind(a),
    transactions: {
      sign: a.transactions.sign.bind(a.transactions),
      get: async (id) => {
        const {req, res, data} = await fetchJSONCache(
          makeRequest(`tx/${id}`),
          TXIDs,
          true
        )

        if (res.statusCode === 200 && data && data.id === id) {
          await TXIDs.put(req, res)
          return new Transaction(data)
        }

        if (res.statusCode === 202) {
          throw new ArweaveError('TX_PENDING')
        }

        if (res.statusCode === 404) {
          throw new ArweaveError('TX_NOT_FOUND')
        }

        if (res.statusCode === 410) {
          throw new ArweaveError('TX_FAILED')
        }

        throw new ArweaveError('TX_INVALID')
      }
    }
  }
}
