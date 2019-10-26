'use strict'

const Joi = require('@hapi/joi')

module.exports = async (config = {}, {route, arweave, prefix}) => {
  const node = arweave.arswarm.node

  route({
    method: 'GET',
    path: `${prefix}/a/swarm/peer`,
    handler: async (request, h) => {
      return node.peer()
    }
  })

  route({
    method: 'GET',
    path: `${prefix}/a/swarm/peers`,
    validate: {
      request: {
        connected: Joi.boolean().default(false)
      }
    },
    handler: async (request, h) => {
      return node.peers()
    }
  })

  route({
    method: 'POST',
    path: `${prefix}/a/swarm/connect`,
    validate: {
      payload: Joi.string().required()
    },
    handler: async (request, h) => {
      await node.connect(request.payload)

      return {ok: true}
    }
  })

  return { }
}
