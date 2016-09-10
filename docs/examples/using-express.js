'use strict'

var Express = require('express')
var Seneca = require('seneca')
var Web = require('../../')
var Routes = require('./common/routes')
var Plugin = require('./common/plugin')

var config = {
  routes: Routes,
  adapter: 'express',
  context: Express()
}

var seneca = Seneca()
  .use(Plugin)
  .use(Web, config)
  .ready(() => {
    var server = seneca.export('web/context')()

    server.listen('4050', (err) => {
      console.log(err || 'server started on: 4050')
    })
  })
