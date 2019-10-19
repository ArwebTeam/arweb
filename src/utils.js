'use strict'

const Joi = require('@hapi/joi')

const schema = Joi.object({
  app: Joi.object({
    id: Joi.string().required() // TODO: id (<a-z0-9-_>.)
  }).required(),
  arweave: Joi.object({
    host: Joi.string().required(), // TODO: host
    port: Joi.number().integer().min(1).max(99999), // TODO: port
    protocol: Joi.string(), // TODO: protocol
    timeout: Joi.number(),
    logging: Joi.boolean()
  }).required(),
  arswarm: Joi.object({
    cache: Joi.object({

    }).default({}),
    id: Joi.object({
      privKey: Joi.string().required(),
      pubKey: Joi.string(),
      id: Joi.string()
    }),
    swarm: Joi.object({
      bootstrap: Joi.array().required()
    }).required()
  }).required(),
  static: Joi.object({
    provider: Joi.function().required(),
    config: Joi.object().default({})
  }).required(),
  api: Joi.object({
    prefix: Joi.string().default('/api')
  }).default({prefix: '/api'})
}).required()

module.exports = {
  schema
}
