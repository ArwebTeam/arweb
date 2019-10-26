'use strict'

module.exports = async (CONFIG = {}, {conf, cache, arweave}) => {
  let config = await conf.get('userconf') || {}

  return {
    set: async (_config) => {
      await conf.set('userconf', _config)
      config = _config
    },
    get: () => config
  }
}
