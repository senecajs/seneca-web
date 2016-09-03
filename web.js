'use strict'

var ExpressAdapter = require('./lib/adapters/express')
var HapiAdapter = require('./lib/adapters/hapi')
var ConnectAdapter = require('./lib/adapters/connect')
var LogAdapter = require('./lib/adapters/log')
var MapRoutes = require('./lib/map-routes')
var _ = require('lodash')

var opts = {
  spec: null,
  server: {
    name: 'hapi',
    context: null,
    adapter: null
  },
  adapters: {
    hapi: HapiAdapter,
    express: ExpressAdapter,
    connect: ConnectAdapter,
    log: LogAdapter
  }
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
    exportspec: {
      getServer: () => {return opts.server},
      setServer: setServer.bind(seneca),
      routeMap: routeMap.bind(seneca)
    }
  }
}


function routeMap (msg, done) {
  var seneca = this
  var context = opts.server.context
  var adapter = opts.server.adapter
  var routes = MapRoutes(msg.routes)

  adapter.call(seneca, context, routes, done)
}

function setServer (msg, done) {
  var seneca = this
  var name = msg.name || ''
  var adapter = msg.adapter || _.get(opts.adapters, name)
  var context = msg.context
  var routes = msg.routes

  opts.server = {
    name: name,
    context: context,
    adapter: adapter
  }

  if (routes) {
    routeMap.call(seneca, routes, done)
    return
  }

  done()
}

function init (msg, done) {
  var config = {
    name: opts.server.name,
    context: opts.server.context,
    adapter: opts.server.adapter,
    routes: opts.routes
  }

  setServer.call(this, config, done)
}
