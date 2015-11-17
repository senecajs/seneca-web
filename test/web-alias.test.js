/* Copyright (c) 2010-2015 Richard Rodger */
/* global it, describe, beforeEach */
'use strict'

var request = require('supertest')
var expect = require('chai').expect

describe('alias', function () {
  var app
  beforeEach(function (done) {
    require('./example.js')(true).then(function (_app_) {
      app = _app_
      done()
    })
  })

  var verbs = ['get', 'post', 'put', 'del']
  verbs.forEach(function (verb) {
    it(verb, function (done) {
      request(app)[verb]('/my-api/this/is/an/alias')
        .expect(function (response) {
          expect(response.body).to.have.property('alias', verb)
        })
      .expect(200, done)
    })
  })

  it('alias with token', function (done) {
    request(app)
      .get('/my-api/this/is/an/alias/123')
      .expect(function (response) {
        expect(response.body).to.have.property('token', '123')
      })
      .expect(200, done)
  })
})

