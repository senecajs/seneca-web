'use strict'

var Hapi = require('hapi')
var Seneca = require('seneca')
var Web = require('../../')

var routes = require('./common/routes')
var plugin = require('./common/plugin')

var server = new Hapi.Server()
server.connection({port: 4000})

var seneca = Seneca()
  .use(plugin)
  .use(Web, {adapter: 'hapi', context: server})
  .ready(() => {
    seneca.act('role:web', {routes: routes}, (err, reply) => {
      server.start((err) => {
        console.log('server started on: ' + server.info.uri)
      })
    })
  })
