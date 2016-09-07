var Connect = require('connect')
var Seneca = require('seneca')
var Web = require('../../')
var routes = require('./common/routes')
var plugin = require('./common/plugin')
var http = require('http')

var connect = Connect()



var seneca = Seneca()
.use(plugin)
.use(Web, {adapter: 'connect', context: connect})

seneca.ready(() => {
  seneca.act('role:web', {routes: routes}, (err, reply) => {
    var server = http.createServer(connect)
    server.listen(4060, () => {
      console.log('server started on: 4060')
    })
  })
})
