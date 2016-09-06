'use strict'

var Express = require('express')
var Seneca = require('seneca')
var Web = require('../../')

var routes = require('./common/routes')
var plugin = require('./common/plugin')

var server = Express()

var seneca = Seneca()
  .use(plugin)
  .use(Web, {adapter: 'express', context: server})
  .ready(() => {
    seneca.act('role:web', {routes: routes}, (err, reply) => {
      server.listen('4050', (err) => {
        console.log('server started on: 4050')
      })
    })
  })
