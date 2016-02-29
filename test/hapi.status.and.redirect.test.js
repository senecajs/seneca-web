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


describe.skip('status & redirect suite', function () {
  it('custom status', function (done) {
    var url = '/t0/s1'

    TestServer.init(function (err, server) {
      expect(err).to.not.exist()
      server.inject(url, function (res) {
        expect(res.statusCode).to.equal(401)
        done()
      })
    })
  })

  it('redirect', function (done) {
    var url = '/t0/s2'

    TestServer.init(function (err, server) {
      expect(err).to.not.exist()
      server.inject(url, function (res) {
        expect(res.statusCode).to.equal(302)
        expect(res.headers.location).to.equal('/myPath')
        done()
      })
    })
  })
})
