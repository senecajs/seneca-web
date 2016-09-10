'use strict'

const Code = require('code')
const Lab = require('lab')
const Request = require('request')
const Seneca = require('seneca')
const Web = require('../')
const Hapi = require('hapi')

const expect = Code.expect
const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it


describe('hapi', () => {
  it('by default routes autoreply', (done) => {
    var server = new Hapi.Server()
    server.connection({port: 4000})

    var config = {
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          ping: true
        }
      }
    }

    var seneca = Seneca({log: 'test'})
      .use(Web, {adapter: 'hapi', context: server})

    seneca.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      seneca.add('role:test,cmd:ping', (msg, reply) => {
        reply(null, {res: 'pong!'})
      })

      server.start((err) => {
        if (err) return done(err)

        Request('http://127.0.0.1:4000/ping', (err, res, body) => {
          if (err) return done(err)

          body = JSON.parse(body)

          expect(body).to.be.equal({res: 'pong!'})
          done()
        })
      })
    })
  })

  it('multiple routes supported', (done) => {
    var server = new Hapi.Server()
    server.connection({port: 4002})

    var seneca = Seneca({log: 'test'})
      .use(Web, {adapter: 'hapi', context: server})

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
        console.log('hi')
        reply(null, {res: 'pong!'})
      })

      seneca.add('role:test,cmd:two', (msg, reply) => {
        reply(null, {res: 'ping!'})
      })

      server.start((err) => {
        if (err) return done(err)

        Request('http://127.0.0.1:4002/one', (err, res, body) => {
          if (err) return done(err)

          body = JSON.parse(body)
          expect(body).to.be.equal({res: 'pong!'})

          Request('http://127.0.0.1:4002/two', (err, res, body) => {
            if (err) return done(err)

            body = JSON.parse(body)

            expect(body).to.be.equal({res: 'ping!'})
            done()
          })
        })
      })
    })
  })
})
