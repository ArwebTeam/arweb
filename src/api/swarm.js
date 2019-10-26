'use strict'

module.exports = async (config = {}, {route, arweave, prefix}) => {
  const node = arweave.arswarm._swarm._node

  route({
    method: 'GET',
    path: `${prefix}/a/swarm/peer`,
    handler: async (request, h) => {
      return {
        id: node.peerInfo.id.toB58String(),
        addrs: node.peerInfo.multiaddrs.toArray().map(String)
      }
    }
  })

  route({
    method: 'GET',
    path: `${prefix}/a/swarm/peers`,
    handler: async (request, h) => {
      const peers = node.peerBook.getAllArray().map((p) => p.isConnected())

      return peers.map(p => ({
        id: p.id.toB58String(),
        addr: p.multiaddrs.toArray().map(String)
      }))
    }
  })

  return { }
}
