'use strict'

// DO NOT RUN HAPI TESTS FOR NODE LESS THAN 4.0.0
if (process.version < 'v4.0.0') {
  return
}

var Code = require('code')
var Lab = require('lab')
var TestServer = require('./hapi.configure.server.js')


var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var expect = Code.expect


describe.skip('test server stats', function () {
  it('list services', function (done) {
    TestServer.init(function (err, server) {
      expect(err).to.not.exist()
      server.seneca.act('role: web, list: service', function (err, services) {
        expect(err).to.not.exist()
        expect(services.length).to.equal(3)
        expect(services[1]['pin$']).to.equal('role:api,cmd:*')
        expect(services[1]['routes$'].length).to.equal(9)
        done()
      })
    })
  })

  it('list routes', function (done) {
    TestServer.init(function (err, server) {
      expect(err).to.not.exist()
      server.seneca.act('role: web, list: route', function (err, routes) {
        expect(err).to.not.exist()
        expect(routes.length).to.equal(10)
        expect(routes[0]['url']).to.equal('/r0/x0')
        done()
      })
    })
  })
})
