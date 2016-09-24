'use strict'

const Code = require('code')
const Lab = require('lab')
const Request = require('request')
const Seneca = require('seneca')
const Web = require('../')
const Express = require('express')
const BodyParser = require('body-parser')

const expect = Code.expect
const lab = exports.lab = Lab.script()
const describe = lab.describe
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

    var seneca = Seneca({log: 'test'})
      .use(Web, {adapter: 'express', context: server})

    seneca.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      seneca.add('role:test,cmd:ping', (msg, reply) => {
        reply(null, {res: 'pong!'})
      })

      server.listen('5000', (err) => {
        if (err) return done(err)

        Request('http://127.0.0.1:5000/ping', (err, res, body) => {
          if (err) return done(err)

          body = JSON.parse(body)

          expect(body).to.be.equal({res: 'pong!'})
          done()
        })
      })
    })
  })

  it('multiple routes supported', (done) => {
    var server = Express()

    var seneca = Seneca({log: 'test'})
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
        if (err) return done(err)

        Request('http://127.0.0.1:5001/one', (err, res, body) => {
          if (err) return done(err)

          body = JSON.parse(body)
          expect(body).to.be.equal({res: 'pong!'})

          Request('http://127.0.0.1:5001/two', (err, res, body) => {
            if (err) return done(err)

            body = JSON.parse(body)
            expect(body).to.be.equal({res: 'ping!'})
            done()
          })
        })
      })
    })
  })

  it('post without body parser defined', (done) => {
    var server = Express()
    var config = {
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          echo: {
            POST: true
          }
        }
      }
    }

    var seneca = Seneca({log: 'test'})
      .use(Web, {adapter: 'express', context: server})

    seneca.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      seneca.add('role:test,cmd:echo', (msg, reply) => {
        reply(null, {value: msg.args.body})
      })

      server.listen('5002', (err) => {
        if (err) return done(err)

        Request.post('http://127.0.0.1:5002/echo', {json: {foo: 'bar'}}, (err, res, body) => {
          if (err) return done(err)
          expect(body.value).to.be.equal('{"foo":"bar"}')
          done()
        })
      })
    })
  })

  it('post with body parser defined', (done) => {
    var server = Express()
    server.use(BodyParser.json())

    var config = {
      options: {
        parseBody: false
      },
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          echo: {
            POST: true
          }
        }
      }
    }

    var seneca = Seneca({log: 'test'})
      .use(Web, {adapter: 'express', context: server})

    seneca.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      seneca.add('role:test,cmd:echo', (msg, reply) => {
        reply(null, msg.args.body)
      })

      server.listen('5003', (err) => {
        if (err) return done(err)

        Request.post('http://127.0.0.1:5003/echo', {json: {foo: 'bar'}}, (err, res, body) => {
          if (err) return done(err)
          expect(body).to.be.equal({foo: 'bar'})
          done()
        })
      })
    })
  })
})
