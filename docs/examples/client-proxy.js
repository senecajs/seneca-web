
'use strict'

var Express = require('express')
var Seneca = require('seneca')
var Web = require('../../')

var routes = require('./common/routes')
var plugin = require('./common/plugin')

var proxy = Seneca()
  .use(plugin)
  .listen({port: '4041'})
  .ready((err) => {

    var seneca = Seneca()
      .use(plugin)
      .use(Web, {adapter: 'express', context: Express()})
      .client({port: '4041', pin: 'role:todo,cmd:new'})
      .ready(() => {
        seneca.act('role:web', {routes: routes}, (err, reply) => {

          // Grab the context (express in our case) so we can
          // run it ourselves. (seneca-web just adds routes)
          var express = seneca.export('web/context')()
          express.listen(4050, (err) => {
            console.log('express listening on 4050')
          })
        })
      })
  })
