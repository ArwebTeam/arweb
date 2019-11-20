'use strict'

const { openDB } = require('idb')

const debug = require('debug')
const log = debug('arweb:txqueue')

const Transaction = require('arweave/web/lib/transaction').default
const ArweaveUtils = require('arweave/web/lib/utils')
const ShimClient = require('./shim-client')
const Lock = require('itz-locking-time')

const TID = () => String(Math.random()).replace(/[0.]/gmi, '')

module.exports = async (arweaveConf, arweave, arswarm) => {
  const lock = Lock()
  const db = await openDB('txqueue', 3, {
    async upgrade (db, oldVersion, newVersion, transaction) {
      await db.createObjectStore('queue', {
        // The 'id' property of the object will be the key.
        keyPath: 'id',
        // If it isn't explicitly set, create a value by auto incrementing.
        autoIncrement: true
      })

      await db.createObjectStore('kfs', {
        keyPath: 'addr'
      })
    }
  })

  const { makeRequest } = ShimClient(arweaveConf)

  function flush () {
    log('run next flush')
    return lock.runNext('process', process)
  }

  async function process () {
    log('running process')

    let out = {
      results: [],
      ok: true
    }

    let anchor

    try {
      anchor = await (await fetch(makeRequest('tx_anchor'))).text()
    } catch (err) {
      out.ok = false
      log('failed loading anchor')
      return out
    }

    let cursor = await db.transaction('queue').store.openCursor()

    let cs = []

    while (cursor) {
      cs.push({value: cursor.value, key: cursor.key})
      cursor = await cursor.continue()
    }

    for (let i = 0; i < cs.length; i++) {
      log('processing %o', i)

      let {value: {kf, tx: txData, id}, key} = cs[i]
      const jwk = (await db.get('kfs', kf)).jwk

      try {
        const tid = txData.id

        txData = Object.assign({}, txData)

        txData.last_tx = anchor
        delete txData.id

        let tx = await orig.createTransaction(txData, jwk)
        await orig.sign(tx, jwk)
        const res = await orig.post(tx)
        await arswarm._cache.del(tid)

        console.info(res)

        // fin
        await db.delete('queue', key)
        out.results.push([id, tx, res])
        log('success %o', id)
      } catch (err) {
        log(err)
        await db.put('queue', {id, kf, tx: txData, err: err.stack, lastAttempt: Date.now()})
        out.results.push([id, err.stack])
        out.ok = false

        if (global.DEBUG) {
          throw err
        }
      }
    }

    if (out.ok) { // cleanup everything on success
      await db.clear('kfs')
      await db.clear('queue')
    }

    return out
  }

  async function append (tx, jwk, addr) {
    let txLocal = {
      // ignore id since sign dependent
      // ignore last_tx since dynamic
      owner: tx.owner || null,
      tags: tx.tags,
      target: tx.target || null,
      quantity: tx.quantity && tx.quantity > 0 ? tx.quantity : null,
      data: tx.data || null,
      reward: tx.reward && tx.reward > 0 ? tx.reward : null,
      // ignore signature since dynamic
      id: TID() // TID is used for adding the TX to arswarm before flushing tx queue
    }

    for (const p in txLocal) {
      if (!txLocal[p]) { delete txLocal[p] }
    }

    tx = {
      // ignore id since sign dependent
      // ignore last_tx since dynamic
      owner: tx.owner || null,
      tags: tx.tags,
      target: tx.target || null,
      quantity: tx.quantity && tx.quantity > 0 ? tx.quantity : null,
      data: tx.data ? ArweaveUtils.b64UrlToBuffer(tx.data) : null,
      reward: tx.reward && tx.reward > 0 ? tx.reward : null,
      // ignore signature since dynamic
      id: TID() // TID is used for adding the TX to arswarm before flushing tx queue
    }

    for (const key in tx) {
      if (tx[key] == null) {
        delete tx[key]
      }
    }

    if (!await db.get('kfs', addr)) {
      await db.add('kfs', {addr, jwk})
    }
    // const qid = String(Math.random().replace(/[0.]/g, ''))
    await db.add('queue', {kf: addr, tx})
    await arswarm._cache.addLocal(txLocal)

    flush() // bg

    return tx.id // TID
  }

  const orig = {
    createTransaction: arweave.createTransaction,
    post: arweave.transactions.post,
    sign: arweave.transactions.sign,
    verify: arweave.transactions.verify
  }

  arweave.createTransaction = async (attributes, jwk) => {
    if (!jwk) {
      console.warn('No JWK specified, using default')
      jwk = arweave.jwk
    }

    const transaction = {}

    Object.assign(transaction, attributes)

    if (!attributes.data && !(attributes.target && attributes.quantity)) {
      throw new Error(
        `A new Arweave transaction must have a 'data' value, or 'target' and 'quantity' values.`
      )
    }

    if (attributes.data) {
      if (typeof attributes.data === 'string') {
        transaction.data = ArweaveUtils.stringToB64Url(attributes.data)
      }
      if (attributes.data instanceof Uint8Array) {
        transaction.data = ArweaveUtils.bufferTob64Url(attributes.data)
      }
    }

    const tx = new Transaction(transaction)
    tx.PSEUDO = true
    tx.jwk = jwk
    tx.addr = await arweave.wallets.jwkToAddress(jwk)
    tx.post = async () => append(tx.toJSON(), tx.jwk, tx.addr)

    return tx
  }

  arweave.transactions.post = async (tx, jwk, addr) => {
    if (!tx.PSEUDO) {
      return orig.post(tx)
    }

    return append(tx.toJSON ? tx.toJSON() : tx, tx.jwk || jwk, tx.addr || await arweave.wallets.jwkToAddress(tx.jwk || jwk))
  }

  arweave.transactions.sign = async (tx, jwk) => {
    if (!tx.PSEUDO) {
      return orig.sign(tx, jwk)
    }

    tx._pseudoSigned = true
    return tx
  }

  arweave.transactions.verify = async (tx, jwk) => {
    if (!tx.PSEUDO) {
      return orig.verify(tx, jwk)
    }

    return tx._pseudoSigned
  }

  return {
    append,
    process,
    flush,
    list: async () => {
      let res = []

      let cursor = await db.transaction('queue').store.openCursor()
      while (cursor) {
        res.push(cursor.value)
        cursor = await cursor.continue()
      }

      return res
    }
  }
}
