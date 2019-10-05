'use strict'

// TODO: only cache success

async function fetchFallbackCache (req, cache) {
  let res

  try {
    res = await fetch(req)
    await cache.put(req, res)
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
    await cache.put(req, res)
  }

  return res
}

async function fetchJSONFallbackCache (req, cache, explicit) {
  let res = await fetchFallbackCache(req, cache)

  const data = await res.json()

  if (explicit) {
    return {
      data,
      isFresh: !res.isFromCache,
      isCached: res.isFromCache
    }
  } else {
    return data
  }
}

async function fetchJSONCache (req, cache) {
  let res = await fetchCache(req, cache)
  return res.json()
}

module.exports = {
  fetchCache,
  fetchJSONCache,

  fetchFallbackCache,
  fetchJSONFallbackCache
}
