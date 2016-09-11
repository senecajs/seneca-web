'use strict'

var ExpressAdapter = require('./lib/adapters/express')
var HapiAdapter = require('./lib/adapters/hapi')
var LogAdapter = require('./lib/adapters/log')
var ConnectAdapter = require('./lib/adapters/connect')
var MapRoutes = require('./lib/map-routes')
var _ = require('lodash')

var opts = {
  routes: null,
  context: null,
  adapter: 'log',
  auth: null,
  adapters: {
    hapi: HapiAdapter,
    express: ExpressAdapter,
    log: LogAdapter,
    connect: ConnectAdapter
  }
}

var locals = {
  context: null,
  adapter: null
}

module.exports = function web (options) {
  var seneca = this
  var extend = seneca.util.deepextend

  // Avoid deepextending context and auth,
  // they aren't stringify friendly
  opts = extend(opts, _.omit(options, ['context', 'auth']))
  opts.context = options.context || null
  opts.auth = options.auth || null

  seneca.add('role:web,routes:*', routeMap)
  seneca.add('role:web,set:server', setServer)
  seneca.add('init:web', init)

  // exported functions, they can be called
  // via seneca.export('web/key').
  var exported = {
    setServer: setServer.bind(seneca),
    routeMap: routeMap.bind(seneca),
    context: () => {
      return locals.context
    }
  }

  return {
    name: 'web',
    exportmap: exported
  }
}

// Creates a route-map and passes it to a given adapter. The msg can
// optionally contain a custom adapter or context for once off routing.
function routeMap (msg, done) {
  var seneca = this
  var adapter = msg.adapter || locals.adapter
  var context = msg.context || locals.context
  var routes = MapRoutes(msg.routes)
  var auth = msg.auth || locals.auth

  // Call the adaptor with the mapped routes, context to apply them to
  // and instance of seneca and the provided consumer callback.
  adapter.call(seneca, context, auth, routes, done)
}

// Sets the 'default' server context. Any call to routeMap will use this server
// as it's context if none is provided. This is the server returned by getServer.
function setServer (msg, done) {
  var seneca = this
  var context = msg.context || locals.context
  var adapter = msg.adapter || locals.adapter
  var auth = msg.auth || locals.auth
  var routes = msg.routes

  // If the adapter is a string, we look up the
  // adapters collection in opts.adapters.
  if (_.isString(adapter)) {
    adapter = _.get(opts.adapters, adapter, null)
  }

  // either replaced or the same. Regardless
  // this sets what is called by routeMap.
  locals = {
    context: context,
    adapter: adapter,
    auth: auth
  }

  // If we have routes in the msg map them and
  // let the matter handle the callback
  if (routes) {
    routeMap.call(seneca, {routes: routes}, done)
  }
  else {
    // no routes to process, let the
    // caller know everything went ok.
    done(null, {ok: true})
  }
}

// This is called as soon as the plugin is loaded (when it
// returns). Any routes or customisations passed via options
// will be processed now via a call to setServer.
function init (msg, done) {
  var config = {
    context: opts.context,
    adapter: opts.adapter,
    routes: opts.routes,
    auth: opts.auth
  }

  setServer.call(this, config, done)
}
