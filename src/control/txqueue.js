'use strict'

const { openDB, deleteDB } = require('idb')
const ArweaveUtils = require('arweave/web/lib/utils')
const ShimClient = require('../arweave/shim-client')

module.exports = async (arweave, {route}, prefix, control) => {
  const db = await openDB('txqueue', 1, {
    upgrade (db, oldVersion, newVersion, transaction) {
      // …
    },
    blocked () {
      // …
    },
    blocking () {
      // …
    }
  })

  const { makeRequest, postJSON } = ShimClient(arweave)

  async function prepareTxData (attributes, jwk, anchor) {
    const transaction = {}

    attributes.data = attributes.data ? ArweaveUtils.b46UrlToBuffer(attributes.data) : null

    Object.assign(transaction, attributes)

    if (!attributes.data && !(attributes.target && attributes.quantity)) {
      throw new Error(
        `A new Arweave transaction must have a 'data' value, or 'target' and 'quantity' values.`
      )
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

    if (attributes.owner == null) {
      transaction.owner = jwk.n
    }

    if (attributes.last_tx == null) {
      transaction.last_tx = anchor
    }

    return transaction
  }

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
      const jwk = await kfs.get(kf)

      delete txData._from
      delete txData._pseudoSigned

      try {
        let tx = await arweave.createTransaction(await prepareTxData(txData, jwk, anchor))
        const res = await (await fetch(makeRequest('tx', postJSON(tx.toJSON())))).text()
        console.info(res)

        // TODO: verify if really submitted

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
  }

  route({
    method: 'GET',
    path: `${prefix}/a/txqueue`,
    handler: async (request, h) => {
      let res = []

      let cursor = await db.transaction('queue').store.openCursor()
      while (cursor) {
        res.push(Object.assign({ id: cursor.key }, cursor.value))

        cursor = await cursor.continue()
      }

      return h.response(res)
    }
  })

  return {
    append: async (TX) => {
      const addr = await control.account()
      if (!addr) {
        throw new Error('Not signed in')
      }
      const jwk = await control.getJWK()

      let tx = await db.transaction('kfs', 'readwrite')
      tx.store.set(addr, jwk)
      await tx.done

      const qid = String(Math.random().replace(/[0.]/g, ''))

      tx = await db.transaction('queue', 'readwrite')
      tx.store.set(qid, {kf: addr, tx: TX})
      await tx.done

      return qid
    }
  }
}
