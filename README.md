seneca-web - a [Seneca](http://senecajs.org) plugin
=========================================================

## Seneca Web Plugin

This plugin provides a web service API routing layer for Seneca action
patterns. It translates HTTP requests with specific URL routes into
action pattern calls. It's a built-in dependency of the Seneca module,
so you don't need to include it manually. Use this plugin to define
your web service API.

[![Build Status](https://travis-ci.org/rjrodger/seneca-web.png?branch=master)](https://travis-ci.org/rjrodger/seneca-web)

For a gentle introduction to Seneca itself, see the
[senecajs.org](http://senecajs.org) site.

If you're using this module, feel free to contact me on Twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.2.2

Tested on: Seneca 0.5.19, Node 0.10.35


### Install

This plugin module is included in the main Seneca module:

```sh
npm install seneca
```

To install separately, use:

```sh
npm install seneca-web
```



## Quick example

```JavaScript
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

  // define some routes that start with /foo
  prefix: '/foo',

  // use action patterns where role has the value 'foo' and cmd is defined
  pin:    {role:'foo',cmd:'*'},

  // for each value of cmd, match some HTTP verb, and use the
  // query parameters as values for the action
  map:{
    zig: true,
    bar: {GET:true},
    qaz: {GET:true,HEAD:true}
  }
}})

var express = require('express')
var app = express()
app.use( seneca.export('web') )
app.listen(3000)

// run: node test/example.js --seneca.log=type:act
// try http://localhost:3000/foo/bar?zoo=a
// returns {"bar":"ab"}
```


## DOCUMENTATION IN PROGRESS

There are many examples of usage however - see
[seneca-examples](http://github.com/rjrodger/seneca-examples) and
[well app](http://github.com/nearform/well).




## Test

```sh
npm test
```


