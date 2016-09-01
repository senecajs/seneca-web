'use strict'

var Hapi = require('hapi')
var _ = require('lodash')

var opts = {
  port: 4050
}

module.exports = function hapi (context, routes, done) {
  var seneca = this
  var options = seneca.options().web || {hapi: {}}
  var extend = seneca.util.deepextend
  var server = context

  // If we don't have a contect we create one
  // ourselves. Options via {web:{hapi:{..}}}
  if (!server) {
    opts = extend(opts, options.hapi)
    server = new Hapi.Server()
    server.connection(opts)
  }

  _.each(routes, (route) => {
    server.route({
      method: route.methods,
      path: route.path,
      handler: (request, reply) => {
        var payload = {
          request$: request,
          response$: reply
        }

        seneca.act(route.pattern, payload, (err, response) => {
          if (err) {
            return reply(err)
          }
          else if (route.autoreply) {
            reply(null, response)
          }
        })
      }
    })
  })

  server.start((err) => {
    console.log('server started on: ' + server.info.uri)
    done()
  })
}
