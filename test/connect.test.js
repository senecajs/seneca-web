'use strict'

const Code = require('code')
const Lab = require('lab')
const Request = require('request')
const Seneca = require('seneca')
const Web = require('../')
const Connect = require('connect')
const BodyParser = require('body-parser')

const expect = Code.expect
const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it

describe('connect', () => {
  it('by default routes autoreply', (done) => {
    var server = Connect()
    var config = {
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          ping: true
        }
      }
    }

    var seneca = Seneca({log: 'test'})
      .use(Web, {adapter: 'connect', context: server})

    seneca.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      seneca.add('role:test,cmd:ping', (msg, reply) => {
        reply(null, {res: 'pong!'})
      })

      server.listen('6000', (err) => {
        if (err) return done(err)

        Request('http://127.0.0.1:6000/ping', (err, res, body) => {
          if (err) return done(err)

          body = JSON.parse(body)

          expect(body).to.be.equal({res: 'pong!'})
          done()
        })
      })
    })
  })

  it('multiple routes supported', (done) => {
    var server = Connect()

    var seneca = Seneca({log: 'test'})
      .use(Web, {adapter: 'connect', context: server})

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

      server.listen('6001', (err) => {
        if (err) return done(err)

        Request('http://127.0.0.1:6001/one', (err, res, body) => {
          if (err) return done(err)

          body = JSON.parse(body)

          expect(body).to.be.equal({res: 'pong!'})

          Request('http://127.0.0.1:6001/two', (err, res, body) => {
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
    var server = Connect()
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
      .use(Web, {adapter: 'connect', context: server})

    seneca.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      seneca.add('role:test,cmd:echo', (msg, reply) => {
        reply(null, {value: msg.args.body})
      })

      server.listen('6003', (err) => {
        if (err) return done(err)

        Request.post('http://127.0.0.1:6003/echo', {json: {foo: 'bar'}}, (err, res, body) => {
          if (err) return done(err)
          expect(body.value).to.be.equal('{"foo":"bar"}')
          done()
        })
      })
    })
  })

  it('post with body parser defined', (done) => {
    var server = Connect()
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

    var seneca = Seneca({log: 'error'})
      .use(Web, {adapter: 'connect', context: server})

    seneca.act('role:web', config, (err, reply) => {
      if (err) return done(err)

      seneca.add('role:test,cmd:echo', (msg, reply) => {
        reply(null, msg.args.body)
      })

      server.listen('6004', (err) => {
        if (err) return done(err)

        Request.post('http://127.0.0.1:6004/echo', {json: {foo: 'bar'}}, (err, res, body) => {
          if (err) return done(err)
          expect(body).to.be.equal({foo: 'bar'})
          done()
        })
      })
    })
  })
})
