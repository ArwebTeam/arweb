'use strict'

const Arweave = require('arweave/web').default
const {fetch} = window

// TODO: only cache success

async function fetchFallbackCache (req, cache) {
  let res

  try {
    res = await fetch(req)
    await cache.put(req, res)
  } catch (err) {
    res = await cache.match(req)

    if (res) {
      res.isFromCache = true
    } else {
      throw err
    }
  }

  return res
}

async function fetchCache (req, cache) {
  let res = await cache.match(req)

  if (!res) {
    res = await fetch(res)
    await cache.put(req, res)
  }

  return res
}

async function fetchJSONFallbackCache (req, cache, explicit) {
  let res = await fetchFallbackCache(req, cache)

  const data = await res.json()

  if (explicit) {
    return {
      data,
      isFresh: !res.isFromCache,
      isCached: res.isFromCache
    }
  } else {
    return data
  }
}

async function fetchJSONCache (req, cache) {
  let res = await fetchCache(req, cache)
  return res.json()
}

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
