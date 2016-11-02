'use strict'

var Seneca = require('seneca')
var Connect = require('connect')
var Http = require('http')
var Web = require('../../')
var Routes = require('./common/routes')
var Plugin = require('./common/plugin')

var config = {
  routes: Routes,
  adapter: require('seneca-web-adapter-connect'),
  context: Connect()
}

var seneca = Seneca()
  .use(Plugin)
  .use(Web, config)
  .ready(() => {
    var connect = seneca.export('web/context')()
    var http = Http.createServer(connect)

    http.listen(4060, () => {
      console.log('server started on: 4060')
    })
  })
