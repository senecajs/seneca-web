// This proves express tests work and the problem lies with
// lab running express. It may be that we are missing default
// middleware or that lab is trying to do some serialization
// that lab doesn't like. Both Lab and Express authors may
// want to see this. See ./test/express.test.js:L54

'use strict'

const Assert = require('assert')
const request = require('request')
const Seneca = require('seneca')
const Web = require('../../')
const Express = require('express')

var server = Express()

var seneca = Seneca({log:'test'})
  .use(Web, {adapter: 'express', context: server})

var config = {
  routes: {
    pin: 'role:test,cmd:*',
    map: {
      one: true,
      two: true
    }
  }
}

seneca.act('role:web', config, (err, reply) => {
  if (err) return done(err)

  seneca.add('role:test,cmd:one', (msg, reply) => {
    reply(null, {res: 'pong!'})
  })

  seneca.add('role:test,cmd:two', (msg, reply) => {
    reply(null, {res: 'ping!'})
  })

  server.listen('5001', (err) => {
    request('http://127.0.0.1:5001/one', (err, res, body) => {
      console.log(JSON.parse(body))

      request('http://127.0.0.1:5001/two', (err, res, body) => {
        console.log(JSON.parse(body))
        process.exit()
      })
    })
  })
})
