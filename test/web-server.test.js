/* Copyright (c) 2010-2015 Richard Rodger */
/* global describe, it, beforeEach */
'use strict'

var request = require('supertest')
var expect = require('chai').expect

describe('express', function () {
  var app
  beforeEach(function (done) {
    require('./example.js')(true).then(function (_app_) {
      app = _app_
      done()
    })
  })

  it('GET foo bar', function (done) {
    request(app)
      .get('/my-api/bar?zoo=a')
      .expect(function (response) {
        expect(response.body).to.have.property('bar', 'ab')
      })
      .expect(200, done)
  })

  it('POST foo qaz', function (done) {
    request(app)
      .post('/my-api/qaz')
      .send({
        zoo: 'b'
      })
      .expect(function (response) {
        expect(response.body).to.have.property('qaz', 'bz')
      })
      .expect(200, done)
  })

  it('GET zed', function (done) {
    request(app)
      .get('/zed')
      .expect(function (response) {
        expect(response.body).to.have.property('dez', 2)
      })
      .expect(200, done)
  })

  it('GET red', function (done) {
    request(app)
      .get('/color/red')
      .expect(function (response) {
        expect(response.body).to.have.property('color', '#F00')
      })
      .expect(200, done)
  })

  it('GET green', function (done) {
    request(app)
      .get('/color/green')
      .expect(function (response) {
        expect(response.body).to.have.property('color', '#0F0')
      })
      .expect(200, done)
  })

  it('GET blue', function (done) {
    request(app)
      .get('/color/blue')
      .expect(function (response) {
        expect(response.body).to.have.property('color', '#00F')
      })
      .expect(200, done)
  })
})

