'use strict'

const Code = require('code')
const Lab = require('lab')
const request = require('request')
const Seneca = require('seneca')
const Web = require('../')
const Express = require('express')

const expect = Code.expect
const lab = exports.lab = Lab.script()
const describe = lab.describe
const beforeEach = lab.beforeEach
const it = lab.it


describe('express', () => {
  it('by default routes autoreply', (done) => {
    var server = Express()
    var config = {
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          ping: true
        }
      }
    }

    var seneca = Seneca({log:'test'})
      .use(Web, {adapter: 'express', context: server})

    seneca.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      seneca.add('role:test,cmd:ping', (msg, reply) => {
        reply(null, {res: 'pong!'})
      })

      server.listen('5000', (err) => {
        if (err) return done(err)

        request('http://127.0.0.1:5000/ping', (err, res, body) => {
          body = JSON.parse(body)

          expect(err).to.be.null()
          expect(body).to.be.equal({res: 'pong!'})
          done()
        })
      })
    })
  })

  it('multiple routes supported', (done) => {
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
        console.log('hi')
        reply(null, {res: 'pong!'})
      })

      seneca.add('role:test,cmd:two', (msg, reply) => {
        reply(null, {res: 'ping!'})
      })

      server.listen('5001', (err) => {
        if (err) return done(err)

        request('http://127.0.0.1:5001/one', (err, res, body) => {
          body = JSON.parse(body)

          expect(err).to.be.null()
          expect(body).to.be.equal({res: 'pong!'})

          request('http://127.0.0.1:5001/two', (err, res, body) => {
            body = JSON.parse(body)

            expect(err).to.be.null()
            expect(body).to.be.equal({res: 'ping!'})
            done()
          })
        })
      })
    })
  })
})
