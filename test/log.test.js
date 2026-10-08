'use strict'

const assert = require('assert')
const Seneca = require('seneca')
const Web = require('../')

describe('log adapter', () => {
  it('logs routes to a sink', (done) => {
    var config = {
      options: {
        sink: (routes) => {
          assert.equal(routes.length, 1)
          seneca.close(done)
        },
      },
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          ping: true,
        },
      },
    }

    var seneca = Seneca({ log: 'test' }).use(Web, config)
  })

  it('logs routes to console by default', (done) => {
    var config = {
      options: {
        sink: null,
      },
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          ping: true,
        },
      },
    }

    var called = false
    var payload = null

    var log = console.log
    console.log = (raw) => {
      called = true
      payload = JSON.parse(raw).routes
    }

    var seneca = Seneca({ log: 'test' })
      .use(Web, config)
      .ready(() => {
        console.log = log
        assert.equal(called, true)
        assert(payload)
        assert.equal(payload.length, 1)

        seneca.close(done)
      })
  })
})
