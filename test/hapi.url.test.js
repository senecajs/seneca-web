'use strict'

var Assert = require('assert')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before

var server

suite('test server suite', function () {
  before({}, function (done) {
    require('./hapi.configure.server.js').init(function (err, srv) {
      Assert(!err)
      server = srv
      done()
    })
  })

  test('simple test 1', function (done) {
    var url = '/t0/a0'

    server.inject(url, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.equal('c0', JSON.parse(res.payload).t)
      Assert.equal('y0', JSON.parse(res.payload).x0)

      done()
    })
  })

  test('simple test 2', function (done) {
    var url = '/t0/a0/111'

    server.inject(url, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.equal('111', JSON.parse(res.payload).m)
      Assert.equal('y0', JSON.parse(res.payload).x0)
      Assert.equal('c1', JSON.parse(res.payload).t)

      done()
    })
  })

  test('simple test 3', function (done) {
    var url = '/t0/a0/222?a1=b1&a2=b2'

    server.inject(url, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.equal('222', JSON.parse(res.payload).m)
      Assert.equal('y0', JSON.parse(res.payload).x0)
      Assert.equal('b1', JSON.parse(res.payload).a1)
      Assert.equal('b2', JSON.parse(res.payload).a2)
      Assert.equal('c1', JSON.parse(res.payload).t)

      done()
    })
  })

  test('simple test post', function (done) {
    var url = '/t0/a0/3333'

    server.inject({
      url: url,
      method: 'POST'
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.equal('3333', JSON.parse(res.payload).m)
      Assert.equal('y0', JSON.parse(res.payload).x0)
      Assert.equal('c1', JSON.parse(res.payload).t)

      done()
    })
  })

  test('simple test post 2', function (done) {
    var url = '/t0/c0/44'

    server.inject({
      url: url,
      method: 'POST'
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.equal('44', JSON.parse(res.payload).m)
      Assert.equal('y0', JSON.parse(res.payload).x0)
      Assert.equal('c2', JSON.parse(res.payload).t)

      done()
    })
  })

  test('simple test post with payload', function (done) {
    var url = '/t0/c0/44'

    server.inject({
      url: url,
      method: 'POST',
      payload: {p: 'l'}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.equal('44', JSON.parse(res.payload).m)
      Assert.equal('y0', JSON.parse(res.payload).x0)
      Assert.equal('c2', JSON.parse(res.payload).t)
      Assert.equal('l', JSON.parse(res.payload).p)

      done()
    })
  })

  test('simple test post with payload', function (done) {
    var url = '/not/valid/endpoint'

    server.inject({
      url: url,
      method: 'POST',
      payload: {p: 'l'}
    }, function (res) {
      Assert.equal(404, res.statusCode)

      done()
    })
  })

  test('simple test get with act error', function (done) {
    var url = '/t0/e1'

    server.inject({
      url: url,
      method: 'GET'
    }, function (res) {
      Assert.equal(500, res.statusCode)

      done()
    })
  })

  test('simple test 1 without startware', function (done) {
    var url = '/r0/x0'

    server.inject(url, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.equal('c0', JSON.parse(res.payload).t)
      Assert.notEqual('y0', JSON.parse(res.payload).x0)

      done()
    })
  })

  test('simple parameter test, data: false', function (done) {
    var url = '/t0/x1?x=b'

    server.inject({
      url: url,
      method: 'POST'
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.deepEqual({x: 'b'}, JSON.parse(res.payload))

      done()
    })
  })

  test('simple request body test, data: false', function (done) {
    var url = '/t0/x1'

    server.inject({
      url: url,
      method: 'POST',
      payload: {x: 'b'}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.deepEqual({x: 'b'}, JSON.parse(res.payload))

      done()
    })
  })

  test('simple parameter test, data: false', function (done) {
    var url = '/t0/x2?x=b'

    server.inject({
      url: url,
      method: 'POST'
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.deepEqual({x: 'b', loc: 0}, JSON.parse(res.payload))

      done()
    })
  })

  test('simple request body test, data: false', function (done) {
    var url = '/t0/x2'

    server.inject({
      url: url,
      method: 'POST',
      payload: {x: 'b'}
    }, function (res) {
      Assert.equal(200, res.statusCode)
      Assert.deepEqual({x: 'b', loc: 1}, JSON.parse(res.payload))

      done()
    })
  })
})
