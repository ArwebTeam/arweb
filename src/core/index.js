'use strict'

const Arswarm = require('arswarm/src')

const Arweave = require('./arweave')
const TxQueue = require('./arweave/txqueue')

const User = require('./user')

const {schema} = require('../utils')

module.exports = async (config) => {
  /* Load config */

  const {value, error} = schema.validate(config)

  if (error) {
    throw error
  }

  config = value

  /* Init */

  const arswarm = await Arswarm(config.arswarm)
  // TODO: make arswarm a plugin instead
  const arweave = await Arweave(config.arweave, arswarm)
  // TODO: add via plugin api
  arweave.txqueue = await TxQueue(config.arweave, arweave, arswarm)

  const user = await User(config.user, { arweave })

  const staticProvider = await config.static.provider(config.static.config, arweave)

  // TODO: provider "user"-like wrapper arround everything, don't expose internals without _ prefix
  const a = {
    arweave,
    user,
    staticProvider,
    api: config.api
  }

  return a
}
