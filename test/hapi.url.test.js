"use strict";

var assert = require('assert')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite;
var test = lab.test;
var before = lab.before;

var server

suite('test server suite', function() {
  before({}, function(done){
    require('./hapi.configure.server.js').init(function(err, srv){
      server = srv
      done()
    })
  })

  test('simple test 1', function(done) {
    var url = '/t0/a0'

    server.inject(url, function(res){
      assert.equal(200, res.statusCode)
      assert.equal('else', JSON.parse(res.payload).something)

      done()
    })
  })

  test('simple test 2', function(done) {
    var url = '/t0/a0/111'

    server.inject(url, function(res){
      assert.equal(200, res.statusCode)
      assert.equal('111', JSON.parse(res.payload).m)

      done()
    })
  })
})
