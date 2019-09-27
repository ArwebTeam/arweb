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
  static: Joi.object({
    provider: Joi.function().required(),
    config: Joi.object().default({})
  }).required()
}).required()

module.exports = {
  schema
}
