# seneca-web

## A HTTP utility plugin for the [Seneca](http://senecajs.org) toolkit


DOCUMENTATION IN PROGRESS

There are many examples of usage however - see [seneca-examples](http://github.com/rjrodger/seneca-examples) and
[well app](http://github.com/nearform/well).




## Support

If you're using this module, feel free to contact me on Twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.1.3

Tested on: Node 0.10.24, Seneca 0.5.17



## Quick example

```JavaScript
var seneca = require('seneca')()

seneca.add('role:foo,cmd:bar',function(args,done){
  done(null,{bar:args.zoo+'b'})
})

seneca.act('role:web',{use:{
  prefix:'/foo',
  pin:{role:'foo',cmd:'*'},
  map:{
    bar: {GET:true}
  }
}})


var connect = require('connect')
var app = connect()
app.use( connect.query() )
app.use( seneca.export('web') )
app.listen(3000)

// run: node test/example.js --seneca.log=type:act
// try http://localhost:3000/foo/bar?zoo=a
// returns {"bar":"ab"}
```


## Test

```sh
npm test
```


