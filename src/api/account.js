'use strict'

module.exports = (config = {}, {route, user, prefix, arweave}) => {
  route({
    method: 'POST',
    path: `${prefix}/a/account/login`,
    handler: async (request, h) => {
      await user.account.setKeyfile(request.payload)

      return user.account.address()
    }
  })

  route({
    method: 'POST',
    path: `${prefix}/a/account/logout`,
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
