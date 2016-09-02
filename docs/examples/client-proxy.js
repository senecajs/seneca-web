
'use strict'

var Seneca = require('seneca')
var Web = require('../../')

var routes = require('./common/routes')
var plugin = require('./common/plugin')

var proxyServer = Seneca()
  .use(plugin)
  .listen({port: '4041'})
  .ready((err) => {
    var server = Seneca()
      .use(Web, {server: {name: 'express'}})
      .use(plugin)
      .client({port: '4041', pin: 'role:todo,cmd:new'})
      .ready(() => {
        server.act('role:web', {spec: routes})
      })
  })
