/* Copyright (c) 2010-2015 Richard Rodger */
/* global it, describe, beforeEach */
'use strict'

var request = require('supertest')
var expect = require('chai').expect

var Lab = require( 'lab' )
var lab = exports.lab = Lab.script()

var describe = lab.describe;
var it = lab.it;
var before = lab.before;

describe('alias', function () {
  var app
  before({}, function (done) {
    require('./example.js')
    done()
  })

  var verbs = ['get', 'post', 'put', 'del']
  verbs.forEach(function (verb) {
    it("test alias for " + verb, function (done) {
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

