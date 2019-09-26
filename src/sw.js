'use strict'

global.window = self // hacky hacky patch

if (global.DEBUG) {
  global.EVENTLOG = []

  for (const prop in console) { // eslint-disable-line guard-for-in
    const o = console[prop].bind(console)
    console[prop] = (...a) => {
      global.EVENTLOG.push([Date.now(), prop, a])
      return o(...a)
    }
  }
}

const Arweave = require('arweave/web').default
const Router = require('sw-power-router')

const {schema} = require('./utils')

module.exports = async (config) => {
  /* Load config */

  const {value, error} = schema.validate(config)

  if (error) {
    throw error
  }

  config = value

  /* Init */

  const arweave = Arweave.init(config.arweave)

  const router = Router(self)

  if (global.DEBUG) {
    router.route({
      method: 'GET',
      path: '/_debug/evenlog'
    }, () => global.EVENTLOG)
  }

  return {
    route: router.route
  }
}
