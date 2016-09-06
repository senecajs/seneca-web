'use strict'

var _ = require('lodash')

module.exports = function hapi (context, routes, done) {
  var seneca = this

  if (!context) {
    return done(new Error('no context provided'))
  }

  _.each(routes, (route) => {
    context.route({
      method: route.methods,
      path: route.path,
      handler: (request, reply) => {
        var payload = {
          request$: request,
          response$: reply
        }

        seneca.act(route.pattern, payload, (err, response) => {
          if (route.autoreply) {
            if (err) {
              reply(err)
            }
            else {
              reply(null, response)
            }
          }
        })
      }
    })
  })

  done(null, {routes: routes})
}
