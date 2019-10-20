'use strict'

global.window = self // hacky hacky patch

if (module.hot) {
  global.window.location = {reload: () => true}
  window.location = {reload: () => true}
}

if (typeof setImmediate === 'undefined') {
  global.setImmediate = require('set-immediate-shim')
}

if (global.DEBUG) {
  process.env.DEBUG = '*'

  global.EVENTLOG = []

  for (const prop in console) { // eslint-disable-line guard-for-in
    const o = console[prop].bind(console) // eslint-disable-line no-console
    console[prop] = (...a) => { // eslint-disable-line no-console
      global.EVENTLOG.push([Date.now(), prop, a])

      try {
        return o(...a)
      } catch (err) {
        global.EVENTLLOG.push([Date.now(), 'ERROR', err])
      }
    }
  }
}

const Arweave = require('./arweave')
const Arswarm = require('arswarm/src/mock')
const Router = require('../sw-power-router')
const ArweaveControl = require('./control')
const TxQueue = require('./control/txqueue')

const Defer = () => {
  const o = {}

  o.p = new Promise((resolve, reject) => {
    o.resolve = resolve
    o.reject = reject
  })

  return o
}

const {schema} = require('./utils')

module.exports = async (config) => {
  /* Load config */

  const {value, error} = schema.validate(config)

  if (error) {
    throw error
  }

  config = value

  /* Init */

  self.addEventListener('install', (event) => {
    event.waitUntil(ready.p)
  })

  self.addEventListener('activate', (event) => {
    event.waitUntil(ready.p)
  })

  // must be loaded first, to apply fetch event
  const router = Router(self)

  const ready = Defer()

  if (global.DEBUG) {
    router.route({
      method: 'GET',
      path: '/_debug/eventlog',
      handler: () => global.EVENTLOG
    })
  }

  /* ASYNC */

  // load arweave cache shim
  const arswarm = await Arswarm(config.arswarm)
  const arweave = await Arweave(config.arweave, arswarm)
  await ArweaveControl(arweave, router, config.api.prefix)
  await TxQueue(config.arweave, arweave, router, config.api.prefix)

  const staticProvider = await config.static.provider(config.static.config, arweave)

  router.route({
    method: 'GET',
    path: '/{asset*}',
    handler: staticProvider
  })

  const a = {
    route: router.route,
    arweave,
    isReady: () => {
      ready.resolve()
      self.clients.claim()
    }
  }

  return a
}
