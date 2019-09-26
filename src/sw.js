'use strict'

const ARQL = require('./arql')

const Call = require('@hapi/call')
const Boom = require('@hapi/boom')

// Create new router

module.exports = async (config) => {
  const router = new Call.Router()

  const arql = new ARQL(self.caches)

  async function emit (event, type, payload) {
    const client = await self.clients.get(event.clientId)
    if (client) client.postMessage(JSON.stringify({ type, payload }))
  }

  async function fetchFromArweave (event, [fullPath, user, service, path, version]) {
    emit(event, 'arweave:captured', { event, fullPath, user, service, path, version })

    const address = await arql.getUserAddress(user)
    emit(event, 'arweave:addressFound', { event, address })

    const transactions = await arql.getTransactionsFor(address, service, path, version)
    emit(event, 'arweave:transactionsFound', { event, transactions })

    if (transactions && transactions.length > 0) {
      const transaction = transactions[0]
      emit(event, 'arweave:redirecting', { event, transaction })
      return arql.get(transaction, path)
    }
  }

  self.addEventListener('fetch', async (event) => {
    if (event.request.url.includes(self.location.origin)) { // if we are in SW scope
      try {
        const r = router.route(event.request.method, new URL(event.request.url).pathname)
        return r.route.handler(r)
      } catch (err) {
        if (!err.isBoom) {
          err = Boom.badImplementation(err.toString()) // eslint-disable-line no-ex-assign
        }

        return new Response(JSON.stringify(err.output.payload), {
          headers: Object.assign(err.output.headers, {'Content-Type': 'application/json'})
        })
      }
    } else {
      event.respondWith(fetch(event.request))
    }
  })

  return {
    route: (options, handler) => router.add(options, {
      handler
    })
  }
}
