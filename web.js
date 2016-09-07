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

  opts = extend(opts, options)

  seneca.add('role:web,routes:*', routeMap)
  seneca.add('role:web,set:server', setServer)
  seneca.add('init:web', init)

  return {
    name: 'web',
    exportmap: {
      context: () => { return locals.context },
      setServer: setServer.bind(seneca),
      routeMap: routeMap.bind(seneca)
    }
  }
}

// Creates a route-map and passes it to a given adapter. The msg can
// optionally contain a custom adapter or context for once off routing.
function routeMap (msg, done) {
  var adapter = msg.adapter || locals.adapter
  var context = msg.context || locals.context
  var seneca = this

  MapRoutes(msg.routes, (result) => {
    if (!result.ok) {
      return done(null, result)
    }

    // Call the adaptor with the mapped routes, context to apply them to
    // and instance of seneca and the provided consumer callback.
    adapter.call(seneca, context, result.routes, done)
  })
}

// Sets the 'default' server context. Any call to routeMap will use this server
// as it's context if none is provided. This is the server returned by getServer.
function setServer (msg, done) {
  var seneca = this
  var context = msg.context || locals.context
  var adapter = msg.adapter || locals.adapter
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
    adapter: adapter
  }

  // If we have routes in the msg map them and
  // let the matter handle the callback
  if (routes) {
    routeMap.call(seneca, routes, done)
  }
  else {
    // no routes to process, let the
    // caller know everything went ok.
    done(null, {ok: true})
  }
}

function init (msg, done) {
  var config = {
    context: opts.context,
    adapter: opts.adapter,
    routes: opts.routes
  }

  setServer.call(this, config, done)
}
