'use strict'

var Seneca = require('seneca')
var Web = require('../../')

var routes = require('./common/routes')
var plugin = require('./common/plugin')

var server = Seneca()
  .use(Web, {server: {name: 'hapi'}})
  .use(plugin)
  .ready(() => {
    server.act('role:web', {routes: routes})
  })
