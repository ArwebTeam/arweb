'use strict'

module.exports = (gateway) => {
  if (!gateway) {
    gateway = 'https://arweave.net'
  }

  return async (query) => {
    let res = await fetch(`${gateway}/arql`, {
      method: 'POST',
      body: JSON.stringify(query)
    })

    res = await res.json()

    return res
  }
}
