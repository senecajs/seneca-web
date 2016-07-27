'use strict'

var Assert = require('assert')
var Lab = require('lab')
var Server = require('./configure-server.js')

var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before


suite('test server suite', function () {
  var agent

  before({}, function (done) {
    Server.init(function (err, agentData, si) {
      Assert.ok(!err)
      agent = agentData

      done()
    })
  })

  test('simple test 1', function (done) {
    var url = '/t0/a0/b0?a1=b1&a2=b2'

    agent
      .get(url)
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.equal(res.headers.h0, 'i0')
        Assert.deepEqual(res.body, {r0: 'r0b0', r1: 'r1b1', r2: 'r2b2', x0: 'ry0'})
        done()
      })
  })

  test('simple test 1', function (done) {
    var url = '/t0/a0/b0?a1=b1'

    agent
      .post(url)
      .send({a2: 'b2', c: 'c'})
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.equal(res.headers.h0, 'i0')
        Assert.deepEqual(res.body, {r0: 'r0pb0', r1: 'pr1b1', r2: 'r2b2', x0: 'ry0', c: 'C'})
        done()
      })
  })

  test('simple test 3', function (done) {
    var url = '/t0/a0/b0?a1=b1'

    agent
      .put(url)
      .send({a2: 'b2'})
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(JSON.parse(res.text), {
          'r0': 'r0undefined',
          'r1': 'r1pundefined',
          'r2': 'r2b2',
          'x0': 'ry0',
          'http$': {'headers': {'h0': 'i0'}},
          'o0': 'p0',
          'q0': 'u0'
        })
        done()
      })
  })

  test('simple test 4', function (done) {
    var url = '/t0/c1?d0=e0'

    agent
      .get(url)
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {d0: 'e0f0'})
        done()
      })
  })

  test('simple test 5', function (done) {
    var url = '/t0/c2'

    agent
      .post(url)
      .send({d1: 'e1', d2: 'e2'})
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {d1: 'e1f1', d2: 'e2'})
        done()
      })
  })

  test('simple test 6', function (done) {
    var url = '/t0/c2'

    agent
      .put(url)
      .send({d1: 'e1', d2: 'e2'})
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {d1: 'e1f1', d2: 'e2'})
        done()
      })
  })

  test('simple test 7', function (done) {
    var url = '/t0/e0'

    agent
      .get(url)
      .send({d1: 'e1', d2: 'e2'})
      .expect(500)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {error: 'Error: seneca: Action cmd:e0,role:api failed: e0.'})
        done()
      })
  })

  test('simple test 8', function (done) {
    var url = '/t0/e1'

    agent
      .get(url)
      .send({d1: 'e1', d2: 'e2'})
      .expect(500)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.equal(res.text, 'e1')
        done()
      })
  })

  test('simple test 9', function (done) {
    var url = '/t0/r0'

    agent
      .get(url)
      .expect(400)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {ok: false, why: 'No input will satisfy me.'})
        done()
      })
  })

  // non-interference with preceding middleware
  test('simple test 10', function (done) {
    var url = '/a'

    agent
      .get(url)
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.equal(res.text, 'A')
        done()
      })
  })

  // startware not triggered
  test('simple test 11', function (done) {
    var url = '/a'

    agent
      .post(url)
      .send({a: 'a'})
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {a: 'a'})
        done()
      })
  })

  // premap not triggered
  test('simple test 12', function (done) {
    var url = '/a'

    agent
      .post(url)
      .send({a: 'a', c: 'c'})
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {a: 'a', c: 'c'})
        done()
      })
  })

  // non-interference with following middleware
  test('simple test 13', function (done) {
    var url = '/b'

    agent
      .get(url)
      .send({a: 'a', c: 'c'})
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.equal(res.text, 'B')
        done()
      })
  })

  // startware triggered as following!
  test('simple test 13', function (done) {
    var url = '/b'

    agent
      .post(url)
      .send({b: 'b'})
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {b: 'B'})
        done()
      })
  })

  // premap not triggered as no map
  test('simple test 13', function (done) {
    var url = '/b'

    agent
      .post(url)
      .send({b: 'b', c: 'c'})
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {b: 'B', c: 'c'})
        done()
      })
  })

  test('simple request body test, data: false', function (done) {
    var url = '/t0/x1'

    agent
      .post(url)
      .send({x: 'b'})
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {x: 'b'})
        done()
      })
  })

  test('simple parameter test, data: false', function (done) {
    var url = '/t0/x1?x=b'

    agent
      .post(url)
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {x: 'b'})
        done()
      })
  })

  test('simple request body test, data: true', function (done) {
    var url = '/t0/x2'

    agent
      .post(url)
      .send({x: 'b'})
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {x: 'b', loc: 1})
        done()
      })
  })

  test('simple parameter test, data: true', function (done) {
    var url = '/t0/x2?x=b'

    agent
      .post(url)
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {x: 'b', loc: 0})
        done()
      })
  })

  test('named parameter name and id', function (done) {
    var url = '/t0/n0/name1/id1'

    agent
      .get(url)
      .expect(200)
      .end(function (err, res) {
        Assert.ok(!err)
        Assert.deepEqual(res.body, {name: 'name1', id: 'id1'})
        done()
      })
  })
})
