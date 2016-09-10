'use strict'

var Seneca = require('seneca')
var Web = require('../../')
var Routes = require('./common/routes')
var Plugin = require('./common/plugin')

var config = {
  routes: Routes,
  adapter: 'log'
}

Seneca()
  .use(Plugin)
  .use(Web, config)
