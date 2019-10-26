'use strict'

global.window = self // hacky hacky patch

if (module.hot) {
  global.window.location = {reload: () => true}
  window.location = {reload: () => true}

  global.localStorage = global.localstorage = {
    getItem: () => 'ar*,libp2p*',
    setItem: () => {},
    removeItem: () => {}
  }
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

const Arswarm = require('arswarm/src')

const Arweave = require('./arweave')
const TxQueue = require('./arweave/txqueue')

const User = require('./user')
const API = require('./api')

const Router = require('sw-power-router')

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
    event.waitUntil((async () => {
      await ready.p
      self.clients.claim()
    })())
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

  // TODO: make arswarm plugin
  const arswarm = await Arswarm(config.arswarm)
  // TODO: refactor as plugins
  const arweave = await Arweave(config.arweave, arswarm)
  arweave.txqueue = await TxQueue(config.arweave, arweave)

  const user = await User(config.user, { arweave })

  await API(config.api, { user, arweave, router })

  const staticProvider = await config.static.provider(config.static.config, arweave)

  router.route({
    method: 'GET',
    path: '/{asset*}',
    handler: staticProvider
  })

  const a = {
    route: router.route,
    arweave,
    user,
    isReady: () => {
      ready.resolve()
    }
  }

  return a
}
