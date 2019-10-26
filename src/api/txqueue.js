'use strict'

module.exports = (config = {}, {route, user, prefix, arweave}) => {
  route({
    method: 'GET',
    path: `${prefix}/a/txqueue`,
    handler: async (request, h) => {
      return arweave.txqueue.list()
    }
  })
}
