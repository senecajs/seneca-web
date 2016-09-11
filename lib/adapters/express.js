'use strict'

var _ = require('lodash')
var ReadBody = require('./read-body')

// This adapter handles routes for express and can authorise using
// passport.js. See ./docs/examples/secure-express.js for more info.
module.exports = function express (options, context, auth, routes, done) {
  var seneca = this

  if (!context) {
    return done(new Error('no context provided'))
  }

  // Routes have methods as an array, we need
  // to loop once per route, per method to get
  // all of the routes correctly.
  _.each(routes, (route) => {
    _.each(route.methods, (method) => {
      // lowercase the method so we can use it
      // ala server[method] aka server.get()
      method = _.toLower(method)

      // There are 3 individual handlers depending
      // on if the route is for authorization, is
      // secure, or neither. Each is explained below.
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

// All routes ultimately get handled by this handler
// if they have not already be redirected or responded.
function handleRoute (seneca, request, reply, route) {
  // Express requires a body parser to work in production
  // This util creates a body obj without neededing a parser
  // but doesn't impact loading one in.
  ReadBody(request, (err, body) => {
    if (err) {
      return reply.status(500).send(err)
    }

    // This is what the seneca handler will get
    // Note! request$ and response$ will be stripped
    // if the message is sent over transport.
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

    // Call the seneca action specified in the config
    seneca.act(route.pattern, payload, (err, response) => {
      if (err) {
        return reply.status(500).send(err)
      }

      // Redirect or reply depending on config.
      if (route.redirect) {
        return reply.redirect(route.redirect)
      }
      if (route.autoreply) {
        return reply.send(response)
      }
    })
  })
}

// Unsecured routes just call the handler directly, no magic.
function unsecuredRoute (seneca, context, method, route) {
  context[method](route.path, (request, reply) => {
    handleRoute(seneca, request, reply, route)
  })
}

// Auth routes call passport.authenticate and can and do redirect
// depending on pass or failure. Generally this means you don't
// need a seneca handler set as the redirects happend instead.
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

// Secured routes check if a valid req.user exists as per express
// general practices. Req.logout() clears this. The handler will
// redirect to a fail redirect in the case of unauthenticated calls.
function securedRoute (seneca, context, method, route) {
  context[method](route.path, (request, reply) => {
    if (!request.user) {
      return reply.redirect(route.secure.fail)
    }

    handleRoute(seneca, request, reply, route)
  })
}
