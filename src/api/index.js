'use strict'

const Account = require('./account')
const Swarm = require('./swarm')
const Config = require('./config')
const Info = require('./info')

module.exports = async ({prefix, account, swarm, config, info} = {}, {router: {route}, user, arweave}) => {
  const p = {route, user, prefix, arweave}

  await Account(account, p)
  await Swarm(swarm, p)
  await Config(config, p)
  await Info(info, p)
}
