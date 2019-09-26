'use strict'

/* const Mimos = require('@hapi/mimos')
const mimos = new Mimos() */

/*
module.exports = async ({gateway, cacheDuration} = {gateway: 'https://arweave.net', cacheDuration: 15}) => {
  return (query) => {
    await fetch(this.gateway + '/arql', {
      method: 'post',
      body: JSON.stringify(query)
    })
  }
}
*/
/* class ArweaveShim {
  constructor (caches, {gateway, cacheDuration} = {gateway: 'https://arweave.net', cacheDuration: 15}) {
    this.db = new ArweaveCache()
    this.caches = caches

    this.gateway = gateway
    this.options = {cacheDuration}
  }

  async arQL (query) {
    // If the cache is fresh, use it...
    const queryHash = hash(JSON.stringify(query).toLowerCase())
    const cachedResult = await this.db.queryResults.where({queryHash}).first()
    const now = new Date().getTime()
    if (cachedResult && cachedResult.time > (now - this.options.cacheDuration * 60 * 1000)) return cachedResult.result

    // Otherwise fetch the latest version...
    let result = await fetch(this.gateway + '/arql', {
      method: 'post',
      body: JSON.stringify(query)
    })
    result = await result.json()

    this.db.queryResults.put({queryHash, result, time: new Date().getTime()})
    return result
  }

  async getTransaction (id) {
    const queryHash = id
    const cachedResult = await this.db.queryResults.where({queryHash}).first()
    if (cachedResult) return cachedResult.result

    try {
      let fetchedResult = await fetch(this.gateway + '/tx/' + id)
      fetchedResult = await fetchedResult.json()
      if (!fetchedResult) return null
      this.db.queryResults.put({queryHash, result: {owner: fetchedResult.owner, tags: fetchedResult.tags}})
      return fetchedResult
    } catch (err) {
      return null
    }
  }

  getMimeType (path) {
    return mimos.path(path).type
  }

  async get (id, path) {
    const req = new Request(this.gateway + '/' + id)
    const res = await this.caches.match(req)
    if (res) return res

    const fetchedRes = await fetch(req)
    const typedRes = new Response(await fetchedRes.blob(), { status: fetchedRes.status, statusText: fetchedRes.statusText, headers: { 'content-type': this.getMimeType(path) } })
    const cacheableRes = typedRes.clone()
    self.caches.open('v1').then(cache => cache.put(req, cacheableRes))
    return typedRes
  }
}

module.exports = ArweaveShim */
