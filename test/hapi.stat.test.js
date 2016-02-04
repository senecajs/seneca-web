'use strict'

var Assert = require('assert')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before

var server

suite('test server stats', function () {
  before({}, function (done) {
    require('./hapi.configure.server.js').init(function (err, srv) {
      Assert(!err)
      server = srv
      done()
    })
  })

  test('list services', function (done) {
    server.seneca.act('role: web, list: service', function (err, services) {
      Assert.ok(!err)
      Assert.equal(3, services.length)
      Assert.equal('role:api,cmd:*', services[1]['pin$'])
      Assert.equal(9, services[1]['routes$'].length)

      done()
    })
  })

  test('list routes', function (done) {
    server.seneca.act('role: web, list: route', function (err, routes) {
      Assert.ok(!err)

      Assert.equal(10, routes.length)
      Assert.equal('/r0/x0', routes[0]['url'])

      done()
    })
  })
})
