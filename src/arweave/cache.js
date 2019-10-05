'use strict'

// TODO: only cache success

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
    res = await fetch(res)
  }

  return res
}

async function fetchJSONFallbackCache (req, cache, explicit) {
  let res = await fetchFallbackCache(req, cache)

  const data = await res.json()

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

  return {
    data: await res.json(),
    req,
    res
  }
}

module.exports = {
  fetchCache,
  fetchJSONCache,

  fetchFallbackCache,
  fetchJSONFallbackCache
}
