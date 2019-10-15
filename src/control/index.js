'use strict'

const KV = require('idb-kv-store')
const Caching = require('itz-caching-time')

module.exports = async ({arweave, route}, prefix) => {
  const conf = new KV('arcontrol')
  const cache = await Caching({storage: new KV('arcontrol.cache')})

  let account = false
  let userconf = await conf.get('userconf') || {}

  const getAddressInfo = cache.proxy(async (address) => {
    const balanceWinston = await arweave.wallets.getBalance(address)
    const balanceAr = arweave.ar.winstonToAr(balanceWinston)
    const lastTXID = await arweave.wallets.getLastTransactionID(address)

    return {
      address,
      balanceAr,
      balanceWinston,
      lastTXID
    }
  }, {name: 'info', ttl: 60 * 1000, bgRefetch: true})

  async function updateLoginStatus () {
    /*

      1. Update account variable
      2. Check previous address. If missmatch:
        - clean up stuff as necesarry?

    */

    const keyfile = await conf.get('keyfile')
    const prevAddr = await conf.get('prevaddr')

    if (!keyfile) {
      account = false
    } else {
      const address = await arweave.wallets.jwkToAddress(keyfile)

      account = address
    }
  }

  route({
    method: 'GET',
    path: `${prefix}/a/info`,
    handler: async (request, h) => {
      let res = {}

      if (account) {
        try {
          res = await getAddressInfo(account)
        } catch (err) {
          res = {address: account, balanceAr: 'N/A', balanceWinston: 'N/A', lastTXID: '0'.repeat(32)}
        }

        res.loggedIn = true
      } else {
        res.loggedIn = false
      }

      res.config = userconf

      return res
    }
  })

  route({
    method: 'POST',
    path: `${prefix}/a/info/keyfile`,
    handler: async (request, h) => {
      const {payload: keyfile} = request
      await conf.set('keyfile', keyfile)
      await updateLoginStatus()

      return account
    }
  })

  route({
    method: 'POST',
    path: `${prefix}/a/info/config`,
    handler: async (request, h) => {
      const {payload: _config} = request
      await conf.set('userconf', _config)
      userconf = _config

      return {ok: true}
    }
  })

  route({
    method: 'GET',
    path: `${prefix}/a/txqueue`,
    handler: async (request, h) => {
      return h.response([])
    }
  })

  route({
    method: 'POST',
    path: `${prefix}/a/keyfile`,
    handler: async (request, h) => {
      const jwk = request.payload
      const address = await arweave.wallets.jwkToAddress(jwk)
      return getAddressInfo(address)
    }
  })

  await updateLoginStatus()
}
