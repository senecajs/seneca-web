'use strict'

var Assert = require('assert')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite
var test = lab.test
var before = lab.before

var agent

var Util = require('./util.js')

var redirectLocation = '/home'
function failed_startware (req, res, done) {
  done({http$: {redirect: redirectLocation, status: '301'}})
}

suite('startware-fail tests ', function () {
  before({}, function (done) {
    Util.init(function (err, agentData, si) {
      Assert(!err)

      agent = agentData

      si.add({role: 'test', cmd: 'service'}, function (args, cb) {
        return cb(null, {ok: true, test: true})
      })
      si.act({
        role: 'web',
        plugin: 'test',
        use: {
          prefix: '/api',
          startware: failed_startware,
          pin: {role: 'test', cmd: '*'},
          map: {
            service: {GET: true}
          }
        }
      })
      done()
    })
  })

  test('simple test', function (done) {
    agent
      .get('/api/service')
      .expect(301)
      .end(function (err, res) {
        Assert(!err)
        Util.log(res)
        Assert.equal(redirectLocation, res.header.location)
        console.log('PASS STARTWARE FAIL TEST')
        done()
      })
  })
})
