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
        }
      }
    }
  }})
})



var express = require('express')
var app = express()
app.use( require('body-parser').json() )
app.use( seneca.export('web') )
app.listen(3001)
