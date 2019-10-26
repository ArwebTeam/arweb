'use strict'

module.exports = (config = {}, {route, user, prefix, arweave}) => {
  route({
    method: 'GET',
    path: `${prefix}/a/config`,
    handler: async (request, h) => {
      return user.config.get()
    }
  })

  route({
    method: 'POST',
    path: `${prefix}/a/config`,
    handler: async (request, h) => {
      await user.config.set(request.payload)

      return {ok: true}
    }
  })
}
