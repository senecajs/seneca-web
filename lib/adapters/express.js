'use strict'

var _ = require('lodash')
var ReadBody = require('./read-body')

module.exports = function express (context, auth, routes, done) {
  var seneca = this

  if (!context) {
    return done(new Error('no context provided'))
  }

  _.each(routes, (route) => {
    _.each(route.methods, (method) => {
      method = _.toLower(method)

      if (!route.auth && !route.secure) {
        unsecuredRoute(seneca, context, method, route)
      }
      else if (route.secure) {
        securedRoute(seneca, context, method, route)
      }
      else if (route.auth) {
        authRoute(seneca, context, method, route, auth)
      }
    })
  })

  return done(null, {routes: routes})
}

function handleRoute (seneca, request, reply, route) {
  ReadBody(request, (err, body) => {
    if (err) {
      return reply.status(500).send(err)
    }

    var payload = {
      request$: request,
      response$: reply,
      args: {
        body: body,
        route: route,
        params: request.params,
        query: request.query,
        user: request.user || null
      }
    }

    seneca.act(route.pattern, payload, (err, response) => {
      if (err) {
        return reply.status(500).send(err)
      }
      if (route.redirect) {
        return reply.redirect(route.redirect)
      }
      if (route.autoreply) {
        return reply.send(response)
      }
    })
  })
}

function unsecuredRoute (seneca, context, method, route) {
  context[method](route.path, (request, reply) => {
    handleRoute(seneca, request, reply, route)
  })
}

function authRoute (seneca, context, method, route, auth) {
  var opts = {
    failureRedirect: route.auth.fail,
    successRedirect: route.auth.pass
  }

  var strategy = auth.authenticate(route.auth.strategy, opts)
  context[method](route.path, strategy, (request, reply) => {
    handleRoute(seneca, request, reply, route)
  })
}

function securedRoute (seneca, context, method, route) {
  context[method](route.path, (request, reply) => {
    if (!request.user) {
      return reply.redirect(route.secure.fail)
    }

    handleRoute(seneca, request, reply, route)
  })
}
