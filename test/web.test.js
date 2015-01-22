/* Copyright (c) 2010-2015 Richard Rodger */
"use strict";


// mocha web.test.js

var util    = require('util')

var _       = require('lodash')
var success = require('success')
var assert  = require('assert')



var seneca  = require('seneca')



describe('user', function() {

  var si = seneca({log:'silent'})
  si.use('../web.js')


  it('empty', function() {
    si.act({role:'web',use:{pin:{},map:{}}})
  })


  it('bad', function(fin) {
    var cc = 0
    var si = seneca({log:'silent',debug:{undead:true},errhandler:function(err){
      assert.equal('seneca: Action role:web failed: web-use: The property \'pin\' is missing and is always required (parent: spec)..',err.message)
      cc++ && fin()
    }})
    si.use('../web.js')
    si.use( function bad(){
      this.act({role:'web',use:{}})
    })
  })


  it('config', function() {
    si.act(
      {
        role:'web',
        use:{
          pin:{},
          map:{}
        },
        config:{a:1},
        plugin:'aaa'
      }, 
      function(err,out){
        assert.ok( null == err)

        si.act({role:'web',cmd:'config', plugin:'aaa'}, function(err,out){
          assert.ok( null == err)
          assert.equal( out.a, 1 )
        })
      }
    )
  })


  it('plugin', function(fin) {
    var si = seneca({log:'silent',errhandler:fin})
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

      this.act('role:web',{use:function(req,res,next){next();}})

      this.act('role:web',{use:{
        prefix:'/foo',
        pin:{role:'foo',cmd:'*'},
        map:{
          zig: true,
          bar: {GET:true},
          qaz: {GET:true,HEAD:true}
        }
      }})
    })

    si.act('role:web,cmd:list',success(fin,function(out){
      assert.equal(out.length,4)

      si.act('role:web,cmd:routes',success(fin,function(out){
        assert.equal(out.length,3)

        si.act({role:'web',stats:true},success(fin,function(out){
          assert.equal(3,_.keys(out).length)
          fin()
        }))
      }))
    }))
  })

})

