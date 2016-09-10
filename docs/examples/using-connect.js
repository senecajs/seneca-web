'use strict'

var Connect = require('connect')
var Seneca = require('seneca')
var Web = require('../../')
var Routes = require('./common/routes')
var Plugin = require('./common/plugin')
var Http = require('http')

var connect = Connect()
var seneca = Seneca()

seneca
  .use(Plugin)
  .use(Web, {adapter: 'connect', context: connect})
  .ready((err) => {
    if (err) return console.log(err)

    seneca.act('role:web', {routes: Routes}, (err, reply) => {
      if (err) return console.log(err)

      var server = Http.createServer(connect)

      server.listen(4060, () => {
        console.log('server started on: 4060')
        console.log(reply.routes)
      })
    })
  })
