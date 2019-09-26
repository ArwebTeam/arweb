'use strict'

const Call = require('@hapi/call')
const Boom = require('@hapi/boom')

module.exports = (self) => {
  const router = new Call.Router()

  self.addEventListener('fetch', async (event) => {
    if (event.request.url.includes(self.location.origin)) { // if we are in SW scope
      try {
        const r = router.route(event.request.method, new URL(event.request.url).pathname)
        const res = r.route.handler(r)

        if (res instanceof Response) {
          return res
        } else if (typeof res === 'object') {
          return new Response(JSON.stringify(res), {
            headers: {'Content-Type': 'application/json'}
          })
        } else if (typeof res === 'string') {
          return new Response(res)
        } else {
          throw Boom.badImplementation('Invalid response')
        }
      } catch (err) {
        if (!err.isBoom) {
          err = Boom.badImplementation(err.toString()) // eslint-disable-line no-ex-assign
        }

        return new Response(JSON.stringify(err.output.payload), {
          headers: Object.assign(err.output.headers, {'Content-Type': 'application/json'}),
          status: err.output.statusCode
        })
      }
    } else {
      return event.respondWith(fetch(event.request))
    }
  })

  return {
    route: (options, handler) => router.add(options, {
      handler
    })
  }
}
