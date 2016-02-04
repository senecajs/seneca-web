'use strict'

var Assert = require('assert')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before

var server

suite('status & redirect suite', function () {
  before({}, function (done) {
    require('./hapi.configure.server.js').init(function (err, srv) {
      Assert(!err)
      server = srv
      done()
    })
  })

  test('custom status', function (done) {
    var url = '/t0/s1'

    server.inject(url, function (res) {
      Assert.equal(401, res.statusCode)

      done()
    })
  })

  test('redirect', function (done) {
    var url = '/t0/s2'

    server.inject(url, function (res) {
      Assert.equal(302, res.statusCode)
      Assert.equal("/myPath", res.headers.location)

      done()
    })
  })
})
