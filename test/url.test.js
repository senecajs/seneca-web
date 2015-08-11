"use strict";

var assert = require('assert')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite;
var test = lab.test;
var before = lab.before;

var agent
var seneca

var util = require('./util.js')

suite('test server suite', function() {
  before({}, function(done){
    require('./configure-server.js').init(function(err, agentData, si){
      agent = agentData
      seneca = si
      done()
    })
  })

  test('simple test 1', function(done) {
    var url = '/t0/a0/b0?a1=b1&a2=b2'

    agent
      .get(url)
      .expect(200)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.equal( res.headers.h0, 'i0' )
        assert.deepEqual(res.body,{ r0: 'r0b0', r1: 'r1b1', r2: 'r2b2', x0: 'ry0' })
        done()
      })
  })

  test('simple test 1', function(done) {
    var url = '/t0/a0/b0?a1=b1'

    agent
      .post(url)
      .send({a2:'b2',c:'c'})
      .expect(200)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.equal( res.headers.h0, 'i0' )
        assert.deepEqual(res.body,{ r0: 'r0pb0', r1: 'pr1b1', r2: 'r2b2', x0: 'ry0', c: 'C' })
        done()
      })
  })

  test('simple test 3', function(done) {
    var url = '/t0/a0/b0?a1=b1'

    agent
      .put(url)
      .send({a2:'b2'})
      .expect(200)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.deepEqual(JSON.parse(res.text),{"r0":"r0undefined","r1":"r1pundefined","r2":"r2b2","x0":"ry0","http$":{"headers":{"h0":"i0"}},"o0":"p0","q0":"u0"})
        done()
      })
  })

  test('simple test 4', function(done) {
    var url = '/t0/c1?d0=e0'

    agent
      .get(url)
      .expect(200)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.deepEqual(res.body,{ d0: 'e0f0' })
        done()
      })
  })

  test('simple test 5', function(done) {
    var url = '/t0/c2'

    agent
      .post(url)
      .send({d1:'e1',d2:'e2'})
      .expect(200)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.deepEqual(res.body,{ d1: 'e1f1', d2: 'e2' })
        done()
      })
  })

  test('simple test 6', function(done) {
    var url = '/t0/c2'

    agent
      .put(url)
      .send({d1:'e1',d2:'e2'})
      .expect(200)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.deepEqual(res.body,{ d1: 'e1f1', d2: 'e2' })
        done()
      })
  })

  test('simple test 7', function(done) {
    var url = '/t0/e0'

    agent
      .get(url)
      .send({d1:'e1',d2:'e2'})
      .expect(500)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.deepEqual(res.body,{ error: 'Error: seneca: Action cmd:e0,role:api failed: e0.' })
        done()
      })
  })

  test('simple test 8', function(done) {
    var url = '/t0/e1'

    agent
      .get(url)
      .send({d1:'e1',d2:'e2'})
      .expect(500)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.equal( res.text, 'e1' )
        done()
      })
  })

  test('simple test 9', function(done) {
    var url = '/t0/r0'

    agent
      .get(url)
      .expect(400)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.deepEqual(res.body, { ok: false, why: 'No input will satisfy me.' })
        done()
      })
  })

  // non-interference with preceding middleware
  test('simple test 10', function(done) {
    var url = '/a'

    agent
      .get(url)
      .expect(200)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.equal( res.text, 'A' )
        done()
      })
  })

  // startware not triggered
  test('simple test 11', function(done) {
    var url = '/a'

    agent
      .post(url)
      .send({a: 'a'})
      .expect(200)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.deepEqual(res.body, {a:'a'})
        done()
      })
  })

  // premap not triggered
  test('simple test 12', function(done) {
    var url = '/a'

    agent
      .post(url)
      .send({a:'a',c:'c'})
      .expect(200)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.deepEqual(res.body, {a:'a',c:'c'})
        done()
      })
  })

  // non-interference with following middleware
  test('simple test 13', function(done) {
    var url = '/b'

    agent
      .get(url)
      .send({a:'a',c:'c'})
      .expect(200)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.equal(res.text, 'B')
        done()
      })
  })

  // startware triggered as following!
  test('simple test 13', function(done) {
    var url = '/b'

    agent
      .post(url)
      .send({b:'b'})
      .expect(200)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.deepEqual( res.body, {b:'B'} )
        done()
      })
  })

  // premap not triggered as no map
  test('simple test 13', function(done) {
    var url = '/b'

    agent
      .post(url)
      .send({b:'b',c:'c'})
      .expect(200)
      .end(function (err, res){
        util.log(res)
        assert.ok( !err )
        assert.deepEqual( res.body, {b:'B',c:'c'} )
        done()
      })
  })
})
