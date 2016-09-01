'use strict'

var Express = require('express')
var _ = require('lodash')

var opts = {
  port: 4050
}

module.exports = function express (context, routes, done) {
  console.log('express')
  var seneca = this
  var options = seneca.options().web || {express: {}}
  var extend = seneca.util.deepextend
  var server = context

  // If we don't have a contect we create one
  // ourselves. Options via {web:{express:{..}}}
  if (!server) {
    opts = extend(opts, options.express)
    server = Express(opts)
  }

  _.each(routes, (route) => {
    _.each(route.methods, (method) => {
      server[_.toLower(method)](route.path, (request, reply) => {
        var payload = {
          request$: request,
          response$: reply
        }

        seneca.act(route.pattern, payload, (err, response) => {
          console.log(err, response)
          console.log(route)
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

  server.listen(opts.port, (err) => {
    console.log('server started on: ', opts.port)
    done()
  })
}
