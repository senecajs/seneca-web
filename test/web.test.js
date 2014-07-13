/* Copyright (c) 2010-2014 Richard Rodger */
"use strict";

// mocha user.test.js


var util    = require('util')

var _       = require('underscore')
var success = require('success')
var assert  = require('chai').assert



var seneca  = require('seneca')



describe('user', function() {

  var si = seneca({log:'silent'})
  si.use('../web.js')

  it('empty', function() {
    si.act({role:'web',use:{pin:{},map:{}}})
  })


  it('config', function() {
    si.act({role:'web',use:{pin:{},map:{}},config:{a:1},plugin:'aaa'}, function(err,out){
      assert.isNull(err)

      si.act({role:'web',cmd:'config', plugin:'aaa'}, function(err,out){
        assert.isNull(err)
        assert.equal( out.a, 1 )
      })
    })
  })


  it('plugin', function(fin) {
    var si = seneca({log:'silent'})
    si.use('../web.js')

    si.use(function qaz(){
      this.add('role:foo,cmd:zig',function(args,done){
        done(null,{bar:args.zoo+'g'})
      })
      this.add('role:foo,cmd:bar',function(args,done){
        done(null,{bar:args.zoo+'b'})
      })
      this.add('role:foo,cmd:qaz',function(args,done){
        done(null,{qaz:args.zoo+'z'})
      })

      this.act('role:web',{use:function(req,res,next){next();}}, function(err){
        assert.isNull(err)
      })

      this.act('role:web',{use:{
        prefix:'/foo',
        pin:{role:'foo',cmd:'*'},
        map:{
          zig: true,
          bar: {GET:true},
          qaz: {GET:true,HEAD:true}
        }
      }}, function(err){
        assert.isNull(err)
      })
    })

    si.act('role:web,cmd:list',success(fin,function(out){
      //console.log(out)
      assert.equal(out.length,4)

      si.act('role:web,cmd:routes',success(fin,function(out){
        //console.log(util.inspect(out,{depth:null}))
        assert.equal(out.length,3)

        si.act({role:'web',stats:true},success(fin,function(out){
          //console.dir(out)
          assert.equal(3,_.keys(out).length)
          fin()
        }))
      }))
    }))
  })

})

