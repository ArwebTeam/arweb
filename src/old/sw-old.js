/* async function emit (event, type, payload) {
  const client = await self.clients.get(event.clientId)
  if (client) client.postMessage(JSON.stringify({ type, payload }))
}

async function fetchFromArweave (event, [fullPath, user, service, path, version]) {
  emit(event, 'arweave:captured', { event, fullPath, user, service, path, version })

  const address = await arql.getUserAddress(user)
  emit(event, 'arweave:addressFound', { event, address })

  const transactions = await arql.getTransactionsFor(address, service, path, version)
  emit(event, 'arweave:transactionsFound', { event, transactions })

  if (transactions && transactions.length > 0) {
    const transaction = transactions[0]
    emit(event, 'arweave:redirecting', { event, transaction })
    return arql.get(transaction, path)
  }
} */
