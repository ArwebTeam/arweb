'use strict'

module.exports = async ({url}, arweave) => {
  return async ({path}) => {
    const res = await fetch(`${url}${path}`)
    if (!res.ok) {
      return fetch(`${url}/index.html`)
    }

    return res
  }
}
