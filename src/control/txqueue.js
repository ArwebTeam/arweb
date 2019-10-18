'use strict'

const { openDB, deleteDB } = require('idb')

const Transaction = require('arweave/web/lib/transaction').default
const ArweaveUtils = require('arweave/web/lib/utils')
const ShimClient = require('../arweave/shim-client')

module.exports = async (arweaveConf, arweave, {route}, prefix) => {
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
    },
    blocked () {
      // …
    },
    blocking () {
      // …
    }
  })

  const { makeRequest, postJSON } = ShimClient(arweaveConf)

  async function process () {
    let anchor

    try {
      anchor = await (await fetch(makeRequest('tx_anchor'))).text()
    } catch (err) {
      return false
    }

    const kfs = await db.transaction('kfs').store
    let cursor = await db.transaction('queue').store.openCursor()

    while (cursor) {
      const {value: {kf, tx: txData}, key} = cursor
      const jwk = await kfs.get(kf).jwk

      try {
        txData.data = txData.data ? ArweaveUtils.b46UrlToBuffer(txData.data) : null
        txData.last_tx = anchor

        let tx = await orig.createTransaction(txData)
        orig.sign(tx, jwk)
        const res = await orig.post(tx)

        console.info(res)

        // fin
        tx = await db.transaction('queue', 'readwrite')
        tx.store.del(key)
        await tx.done
      } catch (err) {
        // TODO: store last error
        console.error(err)
      }

      cursor = await cursor.continue()
    }

    // TODO: cleanup afterwards ONLY on success
  }

  async function append (tx, jwk, addr) {
    tx = {
      // ignore id since sign dependent
      // ignore last_tx since dynamic
      owner: tx.owner || null,
      tags: tx.tags,
      target: tx.target || null,
      quantity: tx.quantity && tx.quantity > 0 ? tx.quantity : null,
      data: tx.data || null,
      reward: tx.reward && tx.reward > 0 ? tx.reward : null
      // ignore signature since dynamic
    }

    await db.add('kfs', {addr, jwk})
    // const qid = String(Math.random().replace(/[0.]/g, ''))
    await db.add('queue', {kf: addr, tx})

    // TODO: get queue id
    return '0'
  }

  route({
    method: 'GET',
    path: `${prefix}/a/txqueue`,
    handler: async (request, h) => {
      let res = []

      let cursor = await db.transaction('queue').store.openCursor()
      while (cursor) {
        res.push(cursor.value)
        cursor = await cursor.continue()
      }

      return h.response(res)
    }
  })

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
    tx.post = async () => append(tx.toJSON())

    return tx
  }

  arweave.transactions.post = async (tx, jwk, addr) => {
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
}
