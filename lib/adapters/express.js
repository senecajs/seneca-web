'use strict'

var _ = require('lodash')

module.exports = function express (context, routes, done) {
  var seneca = this

  if (!context) {
    return done(new Error('no context provided'))
  }

  _.each(routes, (route) => {
    _.each(route.methods, (method) => {
      context[_.toLower(method)](route.path, (request, reply) => {
        var payload = {
          request$: request,
          response$: reply
        }

        seneca.act(route.pattern, payload, (err, response) => {
          if (err) {
            return reply.status(500).send(err)
          }
          else if (route.autoreply) {
            reply.send(response)
          }
        })
      })
    })
  })

  return done(null, {routes: routes})
}
