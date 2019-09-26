'use strict'

const B64js = 'base64-js'
const {xxHash32} = require('js-xxhash')
const ArweaveCache = require('./cache')
const Mimos = require('@hapi/mimos')
const mimos = new Mimos()

// Helpers
function b64UrlEncode (b64UrlString) {
  return b64UrlString
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/[=]/g, '')
}

function b64UrlDecode (b64UrlString) {
  b64UrlString = b64UrlString.replace(/-/g, '+').replace(/_/g, '/')
  let padding
  b64UrlString.length % 4 === 0
    ? (padding = 0)
    : (padding = 4 - (b64UrlString.length % 4))
  return b64UrlString.concat('='.repeat(padding))
}

async function ownerToAddress (owner) {
  const buffer = new Uint8Array(B64js.toByteArray(b64UrlDecode(owner)))
  const digest = await self.crypto.subtle.digest('SHA-256', buffer)
  return b64UrlEncode(B64js.fromByteArray(new Uint8Array(digest)))
}

const hashTextEncoder = new TextEncoder()
function hash (string) {
  return xxHash32(hashTextEncoder.encode(string), 0).toString(16)
}

class ArweaveShim {
  constructor (caches, {gateway, cacheDuration} = {gateway: 'https://arweave.net', cacheDuration: 15}) {
    this.db = new ArweaveCache()
    this.caches = caches

    this.gateway = gateway
    this.options = {cacheDuration}
  }

  async arQL (query) {
    // If the cache is fresh, use it...
    const queryHash = hash(JSON.stringify(query).toLowerCase())
    const cachedResult = await this.db.queryResults.where({queryHash}).first()
    const now = new Date().getTime()
    if (cachedResult && cachedResult.time > (now - this.options.cacheDuration * 60 * 1000)) return cachedResult.result

    // Otherwise fetch the latest version...
    const result = await fetch(this.gateway + '/arql', {
      method: 'post',
      body: JSON.stringify(query)
    }).then(x => x.json())
    this.db.queryResults.put({queryHash, result, time: new Date().getTime()})
    return result
  }

  async getTransaction (id) {
    const queryHash = id
    const cachedResult = await this.db.queryResults.where({queryHash}).first()
    if (cachedResult) return cachedResult.result

    try {
      let fetchedResult = await fetch(this.gateway + '/tx/' + id)
      fetchedResult = await fetchedResult.json()
      if (!fetchedResult) return null
      this.db.queryResults.put({queryHash, result: {owner: fetchedResult.owner, tags: fetchedResult.tags}})
      return fetchedResult
    } catch (err) {
      return null
    }
  }

  getMimeType (path) {
    return mimos.path(path).type
  }

  async get (id, path) {
    const req = new Request(this.gateway + '/' + id)
    const res = await this.caches.match(req)
    if (res) return res

    const fetchedRes = await fetch(req)
    const typedRes = new Response(await fetchedRes.blob(), { status: fetchedRes.status, statusText: fetchedRes.statusText, headers: { 'content-type': this.getMimeType(path) } })
    const cacheableRes = typedRes.clone()
    caches.open('v1').then(cache => cache.put(req, cacheableRes))
    return typedRes
  }

  /* async getUserAddress (alias) {
    const cachedAlias = await this.db.aliases.where({alias}).first()
    if (cachedAlias) return cachedAlias.address

    const txs = await this.arQL({
      op: 'and',
      expr1: {
        op: 'equals',
        expr1: 'App-Name',
        expr2: 'arweave-id'
      },
      expr2: {
        op: 'and',
        expr1: {
          op: 'equals',
          expr1: 'Alias',
          expr2: alias
        },
        expr2: {
          op: 'equals',
          expr1: 'Type',
          expr2: 'name'
        }
      }
    })

    if (!txs || txs.length === 0) { throw new Error('User alias not found') }

    const tx = await this.getTransaction(txs[0])
    const address = await ownerToAddress(tx.owner)
    this.db.aliases.put({alias, address, txId: tx.id})
    return address
  }

  getTransactionsFor (address, service = 'me', path = 'index.html', version = null) {
    const query = {
      op: 'and',
      expr1: {
        op: 'equals',
        expr1: 'service',
        expr2: service
      },
      expr2: {
        op: 'and',
        expr1: {
          op: 'equals',
          expr1: 'from',
          expr2: address
        },
        expr2: {
          op: 'equals',
          expr1: 'path',
          expr2: path
        }
      }
    }

    if (version) {
      query.expr2.expr2 = {
        op: 'and',
        expr1: {
          op: 'equals',
          expr1: 'path',
          expr2: path
        },
        expr2: {
          op: 'equals',
          expr1: 'version',
          expr2: version
        }
      }
    }

    return this.arQL(query)
  } */
}

module.exports = ArweaveShim
