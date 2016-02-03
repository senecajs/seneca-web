'use strict'

var Assert = require('assert')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var after = lab.after
var before = lab.before

var agent
var seneca

var Util = require('./util.js')

suite('example suite tests ', function () {
  before({}, function (done) {
    Util.init(function (err, agentData, si) {
      Assert(!err)
      agent = agentData
      seneca = si

      seneca.add('role:foo,cmd:zig', function (args, done) {
        done(null, {bar: 'zig'})
      })

      seneca.add('role:foo,cmd:bar', function (args, done) {
        done(null, {bar: 'b'})
      })

      var qaz = function (args, done) {
        done(null, {qaz: args.zoo + 'z'})
      }

      seneca.add('role:foo,cmd:qaz', qaz)
      seneca.add('role:foo,cmd:qazz', qaz)


      seneca.act('role:web', {
        use: {
          prefix: '/my-api',
          pin: {role: 'foo', cmd: '*'},
          map: {
            zig: true,
            bar: {GET: true},
            qaz: {GET: true, POST: true},
            qazz: {GET: true, alias: '/qazz/:zoo'}
          }
        }
      }, done)
    })
  })

  after(function (done) {
    seneca.close(done)
  })

  test('simple test - get method', function (done) {
    agent
      .get('/my-api/bar')
      .expect(200)
      .end(function (err, res) {
        Assert.equal('b', res.body.bar, 'Invalid response')
        done(err)
      })
  })

  test('can send data on get method', function (done) {
    agent
      .get('/my-api/qaz')
      .send({zoo: 'test'})
      .expect(200)
      .end(function (err, res) {
        Assert.equal('testz', res.body.qaz, 'Invalid response')
        done(err)
      })
  })

  test('maps to post method', function (done) {
    agent
      .post('/my-api/qaz')
      .send({zoo: 'test'})
      .expect(200)
      .end(function (err, res) {
        Assert.equal('testz', res.body.qaz, 'Invalid response')
        done(err)
      })
  })

  test('maps to get method', function (done) {
    agent
      .get('/my-api/qazz/val')
      .expect(200)
      .end(function (err, res) {
        Assert.equal('valz', res.body.qaz, 'Invalid response')
        done(err)
      })
  })
})
