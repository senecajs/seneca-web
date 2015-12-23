"use strict";

var assert = require('assert')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite;
var test = lab.test;
var before = lab.before;

var server

suite('test server stats', function() {
  before({}, function(done){
    require('./hapi.configure.server.js').init(function(err, srv){
      server = srv
      done()
    })
  })

  test('list services', function(done) {
    server.seneca.act('role: web, list: service', function(err, services){
      assert.ok(!err)
      assert.equal(3, services.length)
      assert.equal('role:api,cmd:*', services[1]['pin$'])
      assert.equal(5, services[1]['routes$'].length)

      done()
    })
  })

  test('list routes', function(done) {
    server.seneca.act('role: web, list: route', function(err, routes){
      assert.ok(!err)

      assert.equal(6, routes.length)
      assert.equal('/r0/x0', routes[0]['url'])

      done()
    })
  })
})
