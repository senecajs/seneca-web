'use strict'

var Seneca = require('seneca')
var Express = require('express')
var Web = require('../../')
var Routes = require('./common/routes')
var Plugin = require('./common/plugin')

var config = {
  routes: Routes,
  adapter: require('seneca-web-adapter-express'),
  context: Express()
}

var seneca = Seneca()
  .use(Plugin)
  .use(Web, config)
  .ready(() => {
    var server = seneca.export('web/context')()

    server.listen('4000', () => {
      console.log('server started on: 4000')
    })
  })
