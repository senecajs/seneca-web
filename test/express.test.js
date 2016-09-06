'use strict'

let Lab = require('lab')

let expect = require('code').expect
let lab = exports.lab = Lab.script()
let Seneca = require('seneca')
let Express = require('express')
let Web = require('../')
let request = require('request')

let defaultRoutes = [
  {
    prefix: '/api',
    pin: 'role:test,cmd:*',
    map: {
      ping: true
    }
  }]
let server = null
let seneca = null
lab.beforeEach((done) => {
  console.log('before each')
  server = Express()
  seneca = Seneca()
  seneca.use(Web, {adapter: 'express', context: server})
  done()
})

lab.experiment('express', () => {
  
  lab.test('can autostart', (done) => {
    seneca.use(function () {
      this.add('role:test,cmd:ping', (msg, reply) => {
        reply(null, {response: 'pong!'})
      })
    })
    
    seneca.ready(() => {
      seneca.act('role:web', {routes: defaultRoutes}, (err, reply) => {
        server.listen('4050', (err) => {
          request('http://localhost:4050/api/ping', function (error, response, body) {
              expect(error).to.be.undefined
              expect(response.statusCode).to.equal(200)
              done()
          })
        })
      })
    })
    
  })
})
