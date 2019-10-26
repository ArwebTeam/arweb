'use strict'

module.exports = (config = {}, {route, user, prefix, arweave}) => {
  route({
    method: 'GET',
    path: `${prefix}/a/info`,
    handler: async (request, h) => {
      let res = {}

      // account

      let address
      if ((address = user.account.address())) {
        try {
          res = await user.account.getAddressInfo(address)
        } catch (err) {
          res = {address, balanceAr: 'N/A', balanceWinston: 'N/A', lastTXID: '0'.repeat(32)}
        }

        res.loggedIn = true
      } else {
        res.loggedIn = false
      }

      // config

      res.config = user.config.get()

      // swarm

      res.connections = arweave.arswarm.node.peers().length

      return res
    }
  })
}
