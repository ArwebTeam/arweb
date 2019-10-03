'use strict'

const arlang = require('arlang')
const Boom = require('@hapi/boom')

function fetchArweaveFile (h, arweave, id, path) {
  return id
  /* return h.response(await fetchedRes.blob())
    .status(fetchedRes.status),
    .message(fetchedRes.statusText) */
}

module.exports = async ({address, id}, arweave) => {
  return async ({path}, h) => {
    const transactions = await arweave.arql(arlang('& (= app $1) (& (= from $2) (= path $3))', {lang: 'sym', params: [id, address, path]}))
    if (transactions.length) {
      let transaction = transactions[0]
      return fetchArweaveFile(h, arweave, transaction, path)
    } else {
      return Boom.notFound(`No arweave entry under ${JSON.stirngify({app: id, from: address, path})}`)
    }
  }
}
