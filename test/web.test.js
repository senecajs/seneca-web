/* Copyright (c) 2010-2013 Richard Rodger */
"use strict";

// mocha user.test.js


var seneca  = require('seneca')

var assert  = require('chai').assert












describe('user', function() {

  var si = seneca()

  it('empty', function() {
    si.act({role:'web',use:{pin:{},map:{}}})
  })
})
