'use strict'

const LogAdapter = require('./lib/adapters/log')
var Mapper = require('./lib/mapper')
var _ = require('lodash')

var opts = {
  routes: null,
  context: null,
  adapter: LogAdapter,
  auth: null,
  middleware: null,
  options: {
    parseBody: true
  }
}

var locals = {
  context: null,
  adapter: null,
  options: null
}

module.exports = function web (options) {
  var seneca = this
  var extend = seneca.util.deepextend

  // Avoid deepextending context, middleware and auth, they aren't stringify friendly
  opts = extend(opts, _.omit(options, ['context', 'auth', 'middleware']))
  opts.context = options.context || null
  opts.auth = options.auth || null
  opts.middleware = options.middleware || null

  seneca.add('role:web,routes:*', mapRoutes)
  seneca.add('role:web,set:server', setServer)
  seneca.add('init:web', init)

  // exported functions, they can be called via seneca.export('web/key').
  var exported = {
    setServer: setServer.bind(seneca),
    mapRoutes: mapRoutes.bind(seneca),
    context: () => {
      return locals.context
    }
  }

  return {name: 'web', exportmap: exported}
}

// Creates a route-map and passes it to a given adapter. The msg can optionally
// contain a custom adapter or context for once off routing.
function mapRoutes (msg, done) {
  var seneca = this
  var adapter = msg.adapter || locals.adapter
  var context = msg.context || locals.context
  var options = msg.options || locals.options
  var routes = Mapper(msg.routes)
  var auth = msg.auth || locals.auth
  var middleware = msg.middleware || locals.middleware

  // Call the adaptor with the mapped routes, context to apply them to and
  // instance of seneca and the provided consumer callback.
  adapter.call(seneca, options, context, auth, middleware, routes, done)
}

// Sets the 'default' server context. Any call to mapRoutes will use this server
// as it's context if none is provided. This is the server returned by
// getServer.
function setServer (msg, done) {
  var seneca = this
  var context = msg.context || locals.context
  var adapter = msg.adapter || locals.adapter
  var options = msg.options || locals.options
  var auth = msg.auth || locals.auth
  var middleware = msg.middleware || locals.middleware
  var routes = msg.routes

  // If the adapter is a string, we look up the adapters collection in
  // opts.adapters.
  if (!_.isFunction(adapter)) {
    return done(new Error('Provide a function as adapter'))
  }

  // either replaced or the same. Regardless this sets what is called by
  // mapRoutes.
  locals = {
    context: context,
    adapter: adapter,
    auth: auth,
    middleware: middleware,
    options: options
  }

  // If we have routes in the msg map them and let the matter handle the callback
  if (routes) {
    mapRoutes.call(seneca, {
      routes: routes
    }, done)
  }
  else {
    // no routes to process, let the caller know everything went ok.
    done(null, {ok: true})
  }
}

// This is called as soon as the plugin is loaded (when it returns). Any routes
// or customisations passed via options will be processed now via a call to
// setServer.
function init (msg, done) {
  var config = {
    context: opts.context,
    adapter: opts.adapter,
    routes: opts.routes,
    auth: opts.auth,
    middleware: opts.middleware,
    options: opts.options
  }

  setServer.call(this, config, done)
}
