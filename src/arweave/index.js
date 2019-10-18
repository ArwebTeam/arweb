'use strict'

const Arweave = require('arweave/web').default
const { fetchJSONCache, fetchJSONFallbackCache } = require('./cache')
const KV = require('idb-kv-store')

const Transaction = require('arweave/web/lib/transaction').default
const ArweaveError = require('arweave/web/lib/error').default
const ArweaveUtils = require('arweave/web/lib/utils')
const ShimClient = require('./shim-client')

module.exports = async (config) => {
  const a = Arweave.init(config)

  const TXIDs = await caches.open('arweaveTXIDs')
  const arql = new KV('arql')

  const { makeRequest, postJSON } = ShimClient(config)

  return {
    arql: async (query) => {
      const req = makeRequest('arql', postJSON(query))
      const key = JSON.stringify(query)
      let res
      let _err
      let isFresh = false

      try {
        let _res = await fetch(req)
        if (!_res.ok) {
          throw new Error(_res.statusText)
        }
        res = await _res.json()
        isFresh = true
      } catch (err) {
        _err = err
      }

      if (_err) {
        let cached = await arql.get(key)
        if (!cached) {
          throw _err
        }

        res = cached
      } else if (res) {
        await arql.set(key, res)
      } else if (!_err && !res) {
        res = []
      }

      return {
        data: res,
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

    createTransaction: async (attributes, jwk) => {
      const from = await a.wallets.jwkToAddress(jwk)

      const transaction = {}

      Object.assign(transaction, attributes)

      if (!attributes.data && !(attributes.target && attributes.quantity)) {
        throw new Error(
          `A new Arweave transaction must have a 'data' value, or 'target' and 'quantity' values.`
        )
      }

      if (attributes.owner == null) {
        transaction.owner = jwk.n
      }

      if (attributes.last_tx == null) {
        transaction.last_tx = await (await makeRequest('tx_anchor')).text()
      }

      if (attributes.reward == null) {
        const data = attributes.data
        let length

        if (data == null) {
          length = 0
        } else if (data instanceof Uint8Array) {
          length = data.byteLength
        } else {
          throw new Error('Expected data to be a Uint8Array')
        }

        transaction.reward = await (await fetch(makeRequest(transaction.target ? `price/${length}/${transaction.target}` : `price/${length}`))).text()
      }

      if (attributes.data) {
        if (typeof attributes.data === 'string') {
          transaction.data = ArweaveUtils.stringToB64Url(attributes.data)
        }
        if (attributes.data instanceof Uint8Array) {
          transaction.data = ArweaveUtils.bufferTob64Url(attributes.data)
        }
      }

      return new Transaction(transaction)
    },
    transactions: {
      sign: a.transactions.sign.bind(a.transactions),
      verify: a.transactions.verify.bind(a.transactions),
      get: async (id) => {
        const {req, res, data} = await fetchJSONCache(
          makeRequest(`tx/${id}`),
          TXIDs,
          true
        )

        if (res.status === 200 && data && data.id === id) {
          await TXIDs.put(req, res)
          return new Transaction(data)
        }

        if (res.status === 202) {
          throw new ArweaveError('TX_PENDING')
        }

        if (res.status === 404) {
          throw new ArweaveError('TX_NOT_FOUND')
        }

        if (res.status === 410) {
          throw new ArweaveError('TX_FAILED')
        }

        throw new ArweaveError('TX_INVALID')
      },
      post: async (tx) => {
        // TODO: publish to arcache as well

        const req = makeRequest('tx', postJSON(tx.toJSON ? tx.toJSON() : tx))
        const res = await fetch(req)
        const text = await res.text()
        if (res.status >= 200 && res.status < 300) {
          return text
        } else {
          throw new Error(`${res.status}: ${text}`)
        }
      }
    }
  }
}
