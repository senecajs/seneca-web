var seneca = require('seneca')({default_plugins:{web:false}})
seneca.use('../web.js')

seneca.use( function p0() {
  this.add('role:api,cmd:c0',function(args,done){
    done(null,{
      r0:'r0'+args.a0,
      r1:'r1'+args.a1,
      r2:'r2'+args.a2,
      x0:'r'+args.req$.x0,
      http$:{
        headers:{
          h0:'i0'
        }
      }
    })
  })

  this.add('role:api,cmd:c1',function(args,done){
    done(null,{d0:args.data.d0+'f0'})
  })

  this.add('role:api,cmd:c2',function(args,done){
    done(null,{d1:args.d1+'f1'})
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
          },
          responder: function( req, res, err, obj ) {
            obj.q0 = 'u0'
            res.end( JSON.stringify(obj) )
          }
        }
      },

      // GET will be used as default method
      c1: {
        dataprop: true
      },

      // GET not defined!!
      c2: {
        dataprop: true,
        POST: { dataprop: false }
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


var express = require('express')
var app = express()
app.use( require('body-parser').json() )
app.use( seneca.export('web') )
app.listen(3001)
