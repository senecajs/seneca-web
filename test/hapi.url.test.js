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
      assert.equal('c0', JSON.parse(res.payload).t)
      assert.equal('y0', JSON.parse(res.payload).x0)

      done()
    })
  })

  test('simple test 2', function(done) {
    var url = '/t0/a0/111'

    server.inject(url, function(res){
      assert.equal(200, res.statusCode)
      assert.equal('111', JSON.parse(res.payload).m)
      assert.equal('y0', JSON.parse(res.payload).x0)
      assert.equal('c1', JSON.parse(res.payload).t)

      done()
    })
  })

  test('simple test 3', function(done) {
    var url = '/t0/a0/222?a1=b1&a2=b2'

    server.inject(url, function(res){
      assert.equal(200, res.statusCode)
      assert.equal('222', JSON.parse(res.payload).m)
      assert.equal('y0', JSON.parse(res.payload).x0)
      assert.equal('b1', JSON.parse(res.payload).a1)
      assert.equal('b2', JSON.parse(res.payload).a2)
      assert.equal('c1', JSON.parse(res.payload).t)

      done()
    })
  })

  test('simple test post', function(done) {
    var url = '/t0/a0/3333'

    server.inject({
      url: url,
      method: 'POST'
    }, function(res){
      assert.equal(200, res.statusCode)
      assert.equal('3333', JSON.parse(res.payload).m)
      assert.equal('y0', JSON.parse(res.payload).x0)
      assert.equal('c1', JSON.parse(res.payload).t)

      done()
    })
  })

  test('simple test post 2', function(done) {
    var url = '/t0/c0/44'

    server.inject({
      url: url,
      method: 'POST'
    }, function(res){
      assert.equal(200, res.statusCode)
      assert.equal('44', JSON.parse(res.payload).m)
      assert.equal('y0', JSON.parse(res.payload).x0)
      assert.equal('c2', JSON.parse(res.payload).t)

      done()
    })
  })

  test('simple test post with payload', function(done) {
    var url = '/t0/c0/44'

    server.inject({
      url: url,
      method: 'POST',
      payload: {p: 'l'}
    }, function(res){
      assert.equal(200, res.statusCode)
      assert.equal('44', JSON.parse(res.payload).m)
      assert.equal('y0', JSON.parse(res.payload).x0)
      assert.equal('c2', JSON.parse(res.payload).t)
      assert.equal('l', JSON.parse(res.payload).p)

      done()
    })
  })

  test('simple test post with payload', function(done) {
    var url = '/not/valid/endpoint'

    server.inject({
      url: url,
      method: 'POST',
      payload: {p: 'l'}
    }, function(res){
      assert.equal(404, res.statusCode)

      done()
    })
  })

  test('simple test get with act error', function(done) {
    var url = '/t0/e1'

    server.inject({
      url: url,
      method: 'GET'
    }, function(res){
      assert.equal(500, res.statusCode)

      done()
    })
  })
  //
  //test('simple test 1 without startware', function(done) {
  //  var url = '/r0/a0'
  //
  //  server.inject(url, function(res){
  //    assert.equal(200, res.statusCode)
  //    assert.equal('c0', JSON.parse(res.payload).t)
  //    assert.notEqual('y0', JSON.parse(res.payload).x0)
  //
  //    done()
  //  })
  //})
})
