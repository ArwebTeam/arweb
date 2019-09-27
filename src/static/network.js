'use strict'

module.exports = async ({url}, arweave) => {
  return async ({path}) => {
    return fetch(`${url}${path}`)
  }
}
