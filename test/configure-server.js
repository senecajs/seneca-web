"use strict";

var assert = require('assert')

var agent
var request = require('supertest')
var cookieparser = require('cookie-parser')
var bodyparser   = require('body-parser')

exports.init = function(done){

  var seneca = require('seneca')({
    default_plugins: { web: false },
    log: 'silent'
  })
  seneca.use('../web.js')

  seneca.ready(function(err){
    assert( !err, 'Seneca configured' )

    var app = require('express')()
    app.use( cookieparser() )
    app.use( bodyparser.json() )

    seneca.use( function p0() {
      this.add('role:api,cmd:c0',function(args,done){
        var out = {
          r0:'r0'+args.a0,
          r1:'r1'+args.a1,
          r2:'r2'+args.a2,
          x0:'r'+args.req$.x0,
          bad$: 'should-not-appear-in-response',
          http$:{
            headers:{
              h0:'i0'
            }
          }
        }

        if(args.c) {
          out.c = args.c
        }

        done(null,out)
      })

      this.add('role:api,cmd:c1',function(args,done){
        done(null,{d0:args.d0+'f0'})
      })

      this.add('role:api,cmd:c2',function(args,done){
        var src = 'PUT' == args.req$.method ? args.data : args
        done(null,{d1:src.d1+'f1',d2:src.d2})
      })

      this.add('role:api,cmd:e0',function(args,done){
        done(new Error('e0'))
      })

      this.add('role:api,cmd:e1',function(args,done){
        done(new Error('e1'))
      })

      this.add('role:api,cmd:r0',function(args,done){
        done(null,{
          ok:false,
          why:'No input will satisfy me.',
          http$:{
            status:400
          }
        })
      })

      this.act('role:web',{use:{
        prefix:'/t0',
        pin:'role:api,cmd:*',
        startware: function(req,res,next){
          req.x0 = 'y0'

          if( req.body && 'a' == req.body.a ) {
            req.body.a = 'A'
          }

          if( req.body && 'b' == req.body.b ) {
            req.body.b = 'B'
          }

          next()
        },
        premap: function(args,req,res,next){
          if( args.c ) {
            args.c = 'C'
          }

          next()
        },
        map: {
          c0: {
            alias: '/a0/:a0',
            GET:   true,
            POST:  function( req, res, args, act, respond ) {
              args.a0 = 'p'+args.a0
              act( args, function(err,out){
                if( err ) return respond(err);

                out.r1 = 'p'+out.r1
                out.c = args.c || undefined
                respond(null,out)
              })
            },
            PUT: {
              useparams: false,
              usequery: false,
              handler: function( req, res, args, act, respond ) {
                args.a1 = 'p'+args.a1
                act( args, respond )
              },
              modify: function( result ) {
                result.out.o0 = 'p0'
                delete result.out.bad$
              },
              responder: function( req, res, err, obj ) {
                obj.q0 = 'u0'
                res.end( JSON.stringify(obj) )
              }
            }
          },

          // GET will be used as default method
          c1: {
            data: true
          },

          // GET not defined!!
          c2: {
            data: true,
            PUT: true,
            POST: { data: false }
          },

          e0: true,
          e1: {
            responder: function( req, res, err, obj ) {
              if( err ) {
                // plain text for errors, no JSON
                res.writeHead(500)

                // seneca formatted Error object
                res.end( err.details.message )
              }
              else res.send(obj)
            }
          },

          r0: true
        }
      }})
    })

    app.get( '/a', function(req,res){
      res.send('A')
    })
    app.post( '/a', function(req,res){
      res.send( {a:req.body.a,c:req.body.c||undefined} )
    })
    app.use( seneca.export('web') )
    app.get( '/b', function(req,res){
      res.send('B')
    })
    app.post( '/b', function(req,res){
      res.send( {b:req.body.b,c:req.body.c||undefined} )
    })

    agent = request( app )
    done(null, agent, seneca)
  })
}
