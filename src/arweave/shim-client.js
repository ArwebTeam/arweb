'use strict'

module.exports = (config) => {
  const makeUrl = (url) => `${config.protocol}://${config.host}:${config.port}/${url}`
  const makeRequest = (url, conf) => new Request(makeUrl(url), conf)
  const postJSON = (data) => {
    return {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  }

  return {
    makeUrl,
    makeRequest,
    postJSON
  }
}
