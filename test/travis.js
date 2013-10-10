"use strict";


var assert = require('assert')

var mock = {
  cmd: {},
  add: function(spec,func){ this.cmd[spec.cmd]=func },
  make: function() { return {} }
}

var user_plugin = require('..')

user_plugin(mock,{},function(){
  var rand = Math.random()
  var start = new Date().getTime()
  mock.cmd.ping({rand:rand},function(err,res){
    assert.ok(null==err)
    assert.equal(res.rand,rand)
    assert.ok(start<=res.when)
  })
})
