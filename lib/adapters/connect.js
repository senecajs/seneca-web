'use strict'

var _ = require('lodash')
var querystring = require('querystring')
var url = require('url')
var readBody = require('./read-body')


module.exports = function connect(context, routes, done) {
  var seneca = this
  if (!context) {
    return done(new Error('no context provided'))
  }
  
  _.each(routes, (route) => {
    context.use(route.path, (request, reply, next) => {
      // Connect does not work with http verbs:
      if (route.methods.indexOf(request.method) !== -1) {
        readBody(request, (err, body) => {
          if (err) {
            reply.writeHead(500, {"Content-Type": "application/json"})
            return reply.end(JSON.stringify(err))
          }

          var payload = {
            request$: request,
            response$: reply,
            args: {
              body: body,
              route: route,
              query: querystring.parse(url.parse(request.originalUrl).query)
            }
          }
          seneca.act(route.pattern, payload, (err, response) => {
            if (err) {
              reply.writeHead(500, {"Content-Type": "application/json"})
              return reply.end(JSON.stringify(err))
            }
            if (route.autoreply) {
              reply.writeHead(200, {"Content-Type": "application/json"})
              reply.end(JSON.stringify(response))
            }
          })
        })
      }
    })
  })
  return done(null, {routes: routes})
}
