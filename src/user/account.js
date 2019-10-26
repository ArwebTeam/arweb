'use strict'

module.exports = async (config = {}, {conf, cache, arweave}) => {
  let account = false

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
    arweave.jwk = keyfile
    const prevAddr = await conf.get('prevaddr')

    if (!keyfile) {
      account = false
    } else {
      const address = await arweave.wallets.jwkToAddress(keyfile)

      account = address
    }

    await conf.set('prevaddr', account)
  }

  await updateLoginStatus()

  return {
    getKeyfile: async () => {
      const keyfile = await conf.get('keyfile')
      if (!keyfile) throw new Error('No keyfile provided')
      return keyfile
    },
    setKeyfile: async (keyfile) => {
      await conf.set('keyfile', keyfile)
      await updateLoginStatus()
    },
    address: () => account,
    getAddressInfo
  }
}
