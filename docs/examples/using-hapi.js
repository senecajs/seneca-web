'use strict'

var Hapi = require('hapi')
var Seneca = require('seneca')
var Web = require('../../')
var Routes = require('./common/routes')
var Plugin = require('./common/plugin')

var config = {
  routes: Routes,
  adapter: 'hapi',
  context: (() => {
    var server = new Hapi.Server()
    server.connection({port: 4000})
    return server
  })()
}

var seneca = Seneca()
  .use(Plugin)
  .use(Web, config)
  .ready(() => {
    var server = seneca.export('web/context')()

    server.start(() => {
      console.log('server started on: ' + server.info.uri)
    })
  })
