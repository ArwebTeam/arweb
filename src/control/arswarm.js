'use strict'

module.exports = async (arswarm, {route}, prefix) => {
  route({
    method: 'GET',
    path: `${prefix}/a/swarm/peer`,
    handler: async (request, h) => {
      return {
        id: arswarm._swarm._node.peerInfo.id.toB58String(),
        addrs: arswarm._swarm._node.peerInfo.multiaddrs.toArray().map(String)
      }
    }
  })

  route({
    method: 'GET',
    path: `${prefix}/a/swarm/peers`,
    handler: async (request, h) => {
      return [] // TODO: arswarm._swarm._node._switch
    }
  })

  return { }
}
