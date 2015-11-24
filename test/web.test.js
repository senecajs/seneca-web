/* Copyright (c) 2010-2015 Richard Rodger */
"use strict";

var _       = require('lodash')
var assert  = require('assert')
var seneca  = require('seneca')
var success = require('success')

var Lab = require('lab')
var lab = exports.lab = Lab.script()
var suite = lab.suite;
var test = lab.test;
var before = lab.before;

var si

suite('configuration suite', function() {
  before({}, function(done){

    si = seneca({log:'silent'})
    si.use('../web.js')
    done()
  })

  test('empty', function(done) {
    si.act({role:'web',use:{pin:{},map:{}}}, done)
  })


  test('bad', function(done) {
    var cc = 0
    var lsi = seneca( {log:'silent',debug:{undead:true} , errhandler:function(err){
      assert.equal('seneca: Action role:web failed: web-use: The property \'pin\' is missing and is always required (parent: spec)..',err.message)
      cc++ && done()
    }})
    lsi.use('../web.js')
    lsi.use( function bad(){
      this.act({role:'web',use:{}})
    })
  })


  test('config', function(done) {
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

        si.act({role:'web',get:'config', plugin:'aaa'}, function(err,out){
          assert.ok( null == err)
          assert.equal( out.a, 1 )
          done()
        })
      }
    )
  })

  test('source', function(done) {
    si.act(
      {
        role:'web',
        set:'source',
        title:'t1',
        source:'s1'
      },
      function(err,out){
        assert.ok( null == err)

        si.act({role:'web',get:'sourcelist'}, function(err,out){
          //console.log(out)
          assert.ok( null == err)
          assert.equal( out.length, 1 )
          assert.equal( '\n;// t1\ns1', out[0] )
          done()
        })
      }
    )
  })


  test('plugin', function(done) {
    var si = seneca({log:'silent',errhandler:done})
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
          qaz: {GET:true,POST:true}
        }
      }})
    })

    si.act('role:web,list:service', success(done, function(out){
      assert.equal(out.length,4)

      si.act('role:web,list:route',success(done,function(out){
        assert.equal(out.length,4)

        si.act({role:'web',stats:true},success(done,function(out){
          assert.equal(4,_.keys(out).length)
          done()
        }))
      }))
    }))
  })

})

