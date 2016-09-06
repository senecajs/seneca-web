'use strict'

let expect = require('code').expect
let Lab = require('lab')
let Hapi = require('hapi')
let Seneca = require('seneca')
let Web = require('../')
let request = require('request')

let lab = exports.lab = Lab.script()

let describe = lab.describe
let it = lab.it
let beforeEach = lab.beforeEach
let afterEach = lab.afterEach

let defaultRoutes = [
  {
    prefix: '/api',
    pin: 'role:test,cmd:*',
    map: {
      ping: true
    }
  }
]


var server = new Hapi.Server()
server.connection({port: 4000})

var seneca = Seneca()
  .use(function plugin () {
    this.add('role:test,cmd:ping', (msg, reply) => {
      reply(null, {response: 'pong!'})
    })
  })
  .use(Web, {adapter: 'hapi', context: server})
  .ready(() => {
    seneca.act('role:web', {routes: defaultRoutes}, (err, reply) => {
      server.start((err) => {
        console.log(server.table())
        console.log('server started on: ' + server.info.uri)
      })
    })
  })


lab.experiment('hapi', () => {
  
  lab.test('can autostart', (done) => {
  
    request('http://127.0.0.1:4000/api/ping', (error, response, body) => {
        expect(error).to.be.undefined
        done()
    })
    
  })
})
