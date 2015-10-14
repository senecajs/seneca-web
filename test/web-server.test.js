/* Copyright (c) 2010-2015 Richard Rodger */
'use strict'

var request = require('supertest')
var expect = require('chai').expect

describe('express', function() {

  var app
  beforeEach(function(done) {
    require('./example.js')(true).then(function(_app_) {
      app = _app_
      done()
    })
  })

  // GET_FOO_BAR=`curl -m 1 -s http://localhost:3000/my-api/bar?zoo=a`
  it('GET foo bar', function(done) {
    request(app)
      .get('/my-api/bar?zoo=a')
      .expect(function(response) {
        expect(response.body).to.have.property('bar', 'ab')
      })
      .expect(200, done)
  })

  // POST_FOO_QAZ=`curl -m 1 -s -H 'Content-Type: application/json' -d '{"zoo":"b"}' http://localhost:3000/my-api/qaz`
  it('POST foo qaz', function(done) {
    request(app)
      .post('/my-api/qaz')
      .send({
        zoo: 'b'
      })
      .expect(function(response) {
        expect(response.body).to.have.property('qaz', 'bz')
      })
      .expect(200, done)
  })

  // ZED=`curl -m 1 -s http://localhost:3000/zed`
  it('GET zed', function(done) {
    request(app)
      .get('/zed')
      .expect(function(response) {
        expect(response.body).to.have.property('dez', 2)
      })
      .expect(200, done)
  })

  // COLOR_RED=`curl -m 1 -s http://localhost:3000/color/red`
  it('GET red', function(done) {
    request(app)
      .get('/color/red')
      .expect(function(response) {
        expect(response.body).to.have.property('color', '#F00')
      })
      .expect(200, done)
  })

  // COLOR_GREEN=`curl -m 1 -s http://localhost:3000/color/green`
  it('GET green', function(done) {
    request(app)
      .get('/color/green')
      .expect(function(response) {
        expect(response.body).to.have.property('color', '#0F0')
      })
      .expect(200, done)
  })

  // COLOR_BLUE=`curl -m 1 -s http://localhost:3000/color/blue`
  it('GET blue', function(done) {
    request(app)
      .get('/color/blue')
      .expect(function(response) {
        expect(response.body).to.have.property('color', '#00F')
      })
      .expect(200, done)
  })
})


