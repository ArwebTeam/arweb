'use strict'

module.exports = (config = {}, {route, user, prefix, arweave}) => {
  route({
    method: 'GET',
    path: `${prefix}/a/account`,
    handler: async (request, h) => {
      if (user.account.address()) {
        return user.account.getAddressInfo(user.account.address())
      } else {
        return {error: 'No keyfile'}
      }
    }
  })

  route({
    method: 'POST',
    path: `${prefix}/a/account`,
    handler: async (request, h) => {
      await user.account.setKeyfile(request.payload)

      return user.account.address()
    }
  })

  route({
    method: 'DELETE',
    path: `${prefix}/a/account`,
    handler: async (request, h) => {
      await user.account.setKeyfile(null)

      return {ok: true}
    }
  })

  route({
    method: 'POST',
    path: `${prefix}/a/account/info`,
    handler: async (request, h) => {
      const jwk = request.payload
      const address = await arweave.wallets.jwkToAddress(jwk)
      return user.account.getAddressInfo(address)
    }
  })
}
