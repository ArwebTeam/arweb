'use strict'

const B64js = require('base64-js')

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

async function getUserAddress (alias) {
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

async function getTransactionsFor (address, service = 'me', path = 'index.html', version = null) {
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
}
