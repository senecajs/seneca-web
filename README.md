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

## Usage

The primary purpose of this plugin is to define URL routes that map to
action patterns. This lets you turn your action patterns into a
well-defined web service API.

The `role:web` action accepts a `use` parameter that is a declarative
definition of a set of routes. You specify a set of action patterns
that will be exposed, and the URL routes that map to each
pattern. Each call to the `role:web` action defines a middleware
service with a set of routes. Incoming requests are passed to each
service in turn until one matches. If none match, the request is
passed onwards down the middleware chain.

The `use` parameter can also be an express-style middleware function
of the form `function( req, res, next )`. You are then free to handle
the action mapping yourself.

To use the services in your app, call `seneca.export('web')` to obtain
a wrapper middleware function that performs the route matching.



## DOCUMENTATION IN PROGRESS

There are many examples of usage however - see
[seneca-examples](http://github.com/rjrodger/seneca-examples) and
[well app](http://github.com/nearform/well).



## Patterns

### role: web, {use: ...}

This command maps a route to a command pattern, which are provided as fields to the `use` option. For example:

```JavaScript
seneca.act('role:web', {use: {
  prefix: '/foo',
  pin: {role:'foo', cmd:'*'},
  map: {
    zig: true,
    bar: {GET: true},
    qaz: {GET: true, HEAD:true}
  }
}});
```

The `prefix` field indicates the prefix used in the URL before the command. For instance, to call the `zig` command, the URL would end in `/foo/zig`. The `pin` field is required, and must be a JavaScript object that would work for the `seneca.pin` method. The `map` field is an object that lists out all of the commands, and provides an optional object for determining which methods the route can use. 

Optionally, `use` can be passed an express-style middleware function with the signature `function(req, res, next) {...}`. For example:

```JavaScript
seneca.act('role:web', {
  use: function(req, res, next) {
    res.write('Hello World!\n');
    next();
  }
});
```

This will then be called on any routes.

### role: web, {plugin: ..., config: ...}

This command adds configuration options to a specified plugin string. For instance:

```JavaScript
seneca.act('role:web', {
  plugin: 'aaa',
  config: {
    test: true
  }
});
```

This plugin information can be retrieved using the pattern `role: web, cmd: config`.

### role: web, cmd: config

This command retrieves configuration information about a specific plugin. For example:

```JavaScript
seneca.act('role:web, cmd:config', {
  plugin: 'aaa'
}, function(err, config) {
  console.log(config);
});
```

Will print out the configuration object associated with the `'aaa'` plugin.

### role: web, cmd: list

This command returns the array of services registered in `seneca-web`. For example:

```JavaScript
seneca.act('role:web, cmd:list', function(err, services) {
  console.log(services);
});
```

This will print out the array of services, which are express-style middleware functions that are called whenever the associated route is requested. In addition, each route has a unique `serviceid$` identifier.

### role: web, cmd: routes

This command returns an array of all of the routes that have services registered to them. For example: 

```JavaScript
seneca.act('role:web, cmd:routes', function(err, routes) {
  console.log(routes);
});
```

### role: web, stats: true


### role: web, cmd: source



## Test

```sh
npm test
```


