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

var redirectLocation = '/home'
function failed_startware(req, res, done){
  done({http$: {redirect: redirectLocation, status: '301'}})
}

suite('startware-fail tests ', function() {
  before({}, function(done){
    util.init(function(err, agentData, si){
      agent = agentData
      seneca = si


      si.add({role: 'test', cmd:'service'}, function(args, cb){
        return cb(null, {ok: true, test: true})
      })
      si.act({
        role:'web',
        plugin:'test',
        use:{
          prefix:'/api',
          startware: failed_startware,
          pin:{role:'test',cmd:'*'},
          map: {
            service: { GET: true }
          }
        }
      })
      done()
    })
  })

  test('simple test', function(done) {
    agent
      .get('/api/service')
      .expect(301)
      .end(function (err, res){
        util.log(res)
        assert.equal(redirectLocation, res.header.location)
        console.log('PASS STARTWARE FAIL TEST')
        done()
      })
  })
})
