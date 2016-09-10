
'use strict'

var Express = require('express')
var Seneca = require('seneca')
var Web = require('../../')

var Routes = require('./common/routes')
var Plugin = require('./common/plugin')

Seneca()
  .use(Plugin)
  .listen({port: '4041'})
  .ready((err) => {
    if (err) return console.log(err)

    var seneca = Seneca()
      .use(Plugin)
      .use(Web, {adapter: 'express', context: Express()})
      .client({port: '4041', pin: 'role:todo,cmd:new'})
      .ready(() => {
        seneca.act('role:web', {routes: Routes}, (err, reply) => {
          if (err) return console.log(err)

          var express = seneca.export('web/context')()
          express.listen(4050, (err) => {
            if (err) return console.log(err)

            console.log('express listening on 4050')
            console.log(reply.routes)
            process.exit()
          })
        })
      })
  })
