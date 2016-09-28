'use strict'

const Code = require('code')
const Lab = require('lab')
const Seneca = require('seneca')
const Web = require('../')

const expect = Code.expect
const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it

describe('log adapter', () => {
  it('logs routes to a sink', (done) => {
    var config = {
      options: {
        sink: (routes) => {
          expect(routes.length).to.be.equal(1)
          done()
        }
      },
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          ping: true
        }
      }
    }

    Seneca({log: 'test'})
      .use(Web, config)
  })

  it('logs routes to console by default', (done) => {
    var config = {
      options: {
        sink: null
      },
      routes: {
        pin: 'role:test,cmd:*',
        map: {
          ping: true
        }
      }
    }

    var called = false
    var payload = null

    var log = console.log
    console.log = (raw) => {
      called = true
      payload = JSON.parse(raw).routes
    }

    Seneca({log: 'test'})
      .use(Web, config)
      .ready(() => {
        expect(called).to.be.true()
        expect(payload).to.exist()
        expect(payload.length).to.be.equal(1)

        console.log = log
        done()
      })
  })
})
