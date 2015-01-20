var seneca = require('seneca')()


seneca.add('role:foo,cmd:zig',function(args,done){
  done(null,{bar:args.zoo+'g'})
})


seneca.add('role:foo,cmd:bar',function(args,done){
  done(null,{bar:args.zoo+'b'})
})

seneca.add('role:foo,cmd:qaz',function(args,done){
  done(null,{qaz:args.zoo+'z'})
})


seneca.act('role:web',{use:{
  prefix:'/foo',
  pin:{role:'foo',cmd:'*'},
  map:{
    zig: true,
    bar: {GET:true},
    qaz: {GET:true,HEAD:true}
  }
}})


seneca.add('zed:1',function(args,done){
  done(null,{dez:2})
})

seneca.act('role:web', {use: function( req, res, next ){
  if( '/zed' == req.url ) {
    req.seneca.act('zed:1',function(err,out){
      if(err) return next(err);

      // assumes an express app
      res.send(out)
    })
  }
  else return next();
}})


var express = require('express')
var app = express()
app.use( seneca.export('web') )
app.listen(3000)

// run: node test/example.js --seneca.log=type:act
// try http://localhost:3000/foo/bar?zoo=a
// returns {"bar":"ab"}
