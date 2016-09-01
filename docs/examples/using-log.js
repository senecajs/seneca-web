'use strict'

var Seneca = require('seneca')
var Web = require('../../')

var routes = require('./common/routes')
var plugin = require('./common/plugin')

var seneca = Seneca()

seneca.use(Web, {server: {name: 'log'}})
      .use(plugin)

seneca.ready(() => {
  seneca.act('role:web', {spec: routes})
})
