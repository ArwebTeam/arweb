'use strict'

module.exports = ({arweave, route}, prefix) => {
  console.log(`${prefix}/a/info`)

  route({
    method: 'GET',
    path: `${prefix}/a/info`,
    handler: async (request, h) => {
      if (false) {
        return {
          loggedIn: true
        }
      } else {
        return {
          loggedIn: false
        }
      }
    }
  })

  route({
    method: 'POST',
    path: `${prefix}/a/keyfile`,
    handler: async (request, h) => {
      const jwk = request.payload
      const address = await arweave.wallets.jwkToAddress(jwk)

      return {address}

      /* const balanceWinston = await arweave.wallets.getBalance(address)
      const balanceAr = arweave.ar.winstonToAr(balanceWinston)
      const lastTXID = await arweave.wallets.getLastTransactionID(address)

      return {
        address,
        balanceAr,
        balanceWinston,
        lastTXID
      } */
    }
  })
}
