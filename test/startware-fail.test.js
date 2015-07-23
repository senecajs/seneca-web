"use strict";

var assert = require('assert')

var redirectLocation = '/home'
function failed_startware(req, res, done){
  done({http$: {redirect: redirectLocation, status: '301'}})
}

function init(cb){
  var agent
  var request = require('supertest')
  var express = require('express')
  var seneca = require('seneca')

  var si = seneca({/*{log: 'print'}*/default_plugins:{web:false}})
  si.use( require('../web.js'), {secure:true, restrict: '/api'} )

  si.ready(function(err){
    if( err ) return process.exit( !console.error(err) );

    var web = si.export('web')

    var app = express()

    app.use( web )
    agent = request(app)


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

    cb(null, agent, si)
  })
}

init(function(err, agent){
  agent
    .get('/api/service')
    .expect(301)
    .end(function (err, res){
      assert.equal(redirectLocation, res.header.location)
      console.log('PASS STARTWARE FAIL TEST')
    })

})
