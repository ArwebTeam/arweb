'use strict'

const arlang = require('arlang')
const Boom = require('@hapi/boom')
const Mimos = require('@hapi/mimos')

const mimos = new Mimos()

function getMimeType (path) {
  return mimos.path(path).type
}

function fetchArweaveFile (arweave, id, path) {
  return id
  // return new Response(await fetchedRes.blob(), { status: fetchedRes.status, statusText: fetchedRes.statusText, headers: { 'content-type': getMimeType(path) } })
}

module.exports = async ({address, id}, arweave) => {
  return async ({path}) => {
    const transactions = await arweave.arql(arlang('& (= app $1) (& (= from $2) (= path $3))', {lang: 'sym', params: [id, address, path]}))
    if (transactions.length) {
      let transaction = transactions[0]
      return fetchArweaveFile(arweave, transaction, path)
    } else {
      return Boom.notFound(`No arweave entry under ${JSON.stirngify({app: id, from: address, path})}`)
    }
  }
}
