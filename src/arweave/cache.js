'use strict'

async function fetchFallbackCache (req, cache) {
  let res

  try {
    res = await fetch(req)
  } catch (err) {
    res = await cache.match(req)

    if (res) {
      res.isFromCache = true
    } else {
      throw err
    }
  }

  return res
}

async function fetchCache (req, cache) {
  let res = await cache.match(req)

  if (!res) {
    res = await fetch(req)
  }

  return res
}

async function fetchJSONFallbackCache (req, cache, explicit) {
  let res = await fetchFallbackCache(req, cache)

  let data
  let parseError

  try {
    data = await res.clone().json()
  } catch (err) {
    parseError = err

    if (res.ok) {
      throw err
    }
  }

  return {
    data,
    parseError,
    req,
    res,
    isFresh: !res.isFromCache,
    isCached: res.isFromCache
  }
}

async function fetchVanillaFallbackCache (req, cache, explicit) {
  let res = await fetchFallbackCache(req, cache)

  const data = await res.clone().text()

  return {
    data,
    req,
    res,
    isFresh: !res.isFromCache,
    isCached: res.isFromCache
  }
}

async function fetchJSONCache (req, cache) {
  let res = await fetchCache(req, cache)

  let data
  let parseError

  try {
    data = await res.clone().json()
  } catch (err) {
    parseError = err

    if (res.ok) {
      throw err
    }
  }

  return {
    data,
    parseError,
    req,
    res
  }
}

async function fetchVanillaCache (req, cache) {
  let res = await fetchCache(req, cache)

  return {
    data: await res.clone().text(),
    req,
    res
  }
}

module.exports = {
  fetchCache,
  fetchVanillaCache,
  fetchJSONCache,

  fetchFallbackCache,
  fetchVanillaFallbackCache,
  fetchJSONFallbackCache
}
