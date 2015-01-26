seneca-web - a [Seneca](http://senecajs.org) plugin
=========================================================

## Seneca Web Plugin

[![Gitter chat](https://badges.gitter.im/rjrodger/seneca-web.png)](https://gitter.im/rjrodger/seneca-web)

This plugin provides a web service API routing layer for Seneca action
patterns. It translates HTTP requests with specific URL routes into
action pattern calls. It's a built-in dependency of the Seneca module,
so you don't need to include it manually. Use this plugin to define
your web service API.

For a gentle introduction to Seneca itself, see the
[senecajs.org](http://senecajs.org) site.

If you're using this module, feel free to contact me on Twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.2.2

Tested on: Seneca 0.5.19, Node 0.10.35

[![Build Status](https://travis-ci.org/rjrodger/seneca-web.png?branch=master)](https://travis-ci.org/rjrodger/seneca-web)

There is [annotated source code](http://rjrodger.github.io/seneca-web/doc/web.html) for this module.


### Install

This plugin module is included in the main Seneca module:

```sh
npm install seneca
```

To install separately (if you're using a fork or branch, say), use:

```sh
npm install seneca-web
```

And in your code:

```js
var seneca = require('seneca')({
  default_plugins:{
    web:false
  }
})
seneca.use( require('seneca-web') )

```


## Quick example

This example defines some API end point URLs that correspond to Seneca actions:

   * `GET /my-api/zig`: `role:foo,cmd:zig`
   * `GET /my-api/bar`: `role:foo,cmd:bar`
   * `GET /my-api/qaz`: `role:foo,cmd:qaz`
   * `POST /my-api/qaz`: `role:foo,cmd:qaz`

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
  prefix: '/my-api',

  // use action patterns where role has the value 'foo' and cmd is defined
  pin:    {role:'foo',cmd:'*'},

  // for each value of cmd, match some HTTP method, and use the
  // query parameters as values for the action
  map:{
    zig: true,
    bar: {GET:true},
    qaz: {GET:true,POST:true}
  }
}})

var express = require('express')
var app = express()
app.use( seneca.export('web') )
app.listen(3000)

// run: node test/example.js --seneca.log=type:act

// try: curl -m 1 -s http://localhost:3000/my-api/bar?zoo=a
// returns {"bar":"ab"}

// try curl -m 1 -s -H 'Content-Type: application/json' -d '{"zoo":"b"}' http://localhost:3000/my-api/qaz
// returns {"qaz":"bz"}
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


#### Alternative Approach

You can use Seneca directly from with your route handlers by just
calling `seneca.act` directly. You don't need to use `seneca-web` at
all. This approach may be more convenient if you already have a larger
scale application architecture, or are integrating Seneca into an
existing system.


#### Warning

This plugin does not provide an access control feature, or protect you
from attacks such as request forgery. However, since it does support
the middleware pattern, you can use [other middleware
modules](http://expressjs.com/resources/middleware.html) to provide
these features.


## Action Patterns

### `role:web`

Define a web service as a mapping from URL routes to action patterns.

_Parameters_

   * `use`: mapping object, or middleware function

#### Middleware Function

When `use` is a function of the form `function(req,res,next) { ... }`
it is considered to be a middleware function, and placed into the list
of middleware provided by the _seneca-web_ plugin.

Use this approach when you need to write special case custom code. The
`req` parameter will contain a `seneca` property that gives you access
to the Seneca instance bound to the current HTTP request. In a HTTP
middleware context it's important to use the request specific Seneca
instance, as other plugins may have added context to that
instance. See, for example: [seneca-user](//github.com/rjrodger/seneca-user).

```JavaScript
seneca.add('zed:1',function(args,done){
  done(null,{dez:2})
})

seneca.act('role:web', {use: function( req, res, next ){
  if( '/zed' == req.url ) {

    // NOTE: req.seneca reference
    req.seneca.act('zed:1',function(err,out){
      if(err) return next(err);

      // assumes an express app
      res.send(out)
    })
  }
  else return next();
}})
```

#### Route Action Mapping

The action mapping object is a convenience format for declarative
definition of a HTTP API based on Seneca actions. You can see examples
of this use-case in these projects:

   * [seneca-examples project](http://github.com/rjrodger/seneca-examples)
   * [Well App](http://github.com/nearform/well)
   * [Nodezoo module search engine](http://github.com/rjrodger/nodezoo)

You specify a set of action patterns, and the URL routes that map to
these patterns. The set of patterns is specified using a _pin_, an
example pattern that includes wildcards for some properties.

For example, if you have defined the patterns:

   * `seneca.add( 'role:color,cmd:red', ... )`
   * `seneca.add( 'role:color,cmd:green', ... )`
   * `seneca.add( 'role:color,cmd:blue', ... )`
   * `seneca.add( 'role:sound,cmd:piano', ... )`

Then the pin `role:color,cmd:*` will pick out the first three patterns:

   * `role:color,cmd:red`
   * `role:color,cmd:green`
   * `role:color,cmd:blue`

but not `role:sound,cmd:piano` as that does not match the pin pattern.

A simple mapping can then be defined as follows:

```
seneca.add('role:color,cmd:red', function( args, done ){
  done( null, {color:'#F00'} )
})

seneca.add('role:color,cmd:green', function( args, done ){
  done( null, {color:'#0F0'} )
})

seneca.add('role:color,cmd:blue', function( args, done ){
  done( null, {color:'#00F'} )
})

seneca.act('role:web', {use:{
  prefix: '/color',
  pin:    'role:color,cmd:*',
  map: {
    red:   true,
    green: true,
    blue:  true,
  }
}})
```

Which creates an HTTP API that responds like so (review
[test.sh](test.sh) and [test/example.js](test/example.js) to see full code):

```bash
$ curl -m 1 -s http://localhost:3000/color/red
  {"color":"#F00"}

$ curl -m 1 -s http://localhost:3000/color/green
  {"color":"#0F0"}

$ curl -m 1 -s http://localhost:3000/color/blue
  {"color":"#00F"}
```

The properties of the mapping define the routes and the action patterns to call:

   * `prefix`: prefix string for the URL, in this case _/color_
   * `pin`:    the pin that selects the actions
   * `map`:    each property of this sub-object should correspond to a matched wildcard value, in this case: red, green, and blue

The map entries define the nature of the route. In the above example,
the default case is to respond to HTTP GET requests. The mapping forms
URLs by appending the name of the wildcard value to the prefix to form
the full URL. So you end up with these endpoints:

   * `GET /color/red`   - responds with: application/json
   * `GET /color/green` - responds with: application/json
   * `GET /color/blue`  - responds with: application/json

To respond to POST requests, do this:

```
seneca.act('role:web', {use:{
  prefix: '/color',
  pin:    'role:color,cmd:*',
  map: {
    red: { POST:true }
  }
}})
```

**Note: you do not have to list all the matching wildcards. Only those
  you list explicitly will be supported.**

The wildcard mapping object accepts the following optional properties
that let you refine the route specification:

   * _METHOD_: any HTTP method (GET, POST, PUT, DELETE, etc); the value can be:
      *  _true_: accept requests with this method.
      * a middleware function: this allows you to completely customize the route.
      * a method specification, see below.
   * _alias_: custom URL path, concatenated to top level prefix; can contain express-style route parameters: _/foo/:bar_ sets _req.params.bar_.
   * _suffix_: appended to route URL.
   * _useparams_: merge any URL parameter values into the arguments for the Seneca action; default: `true` 
   * _usequery_: merge any URL query values into the arguments for the Seneca action; default: `true` 
   * _dataprop_: provide all request parameters inside a `data` property on the Seneca action, default: `false`
   * _redirect_: perform a 302 redirection with the value as the new location URL.
   * _handler_: function that translates inbound requests to Seneca actions, see below.
   * _responder_: function that translates outbound Seneca results into HTTP response data, see below.
   * _modify_: function that modifies the output object in some way (usually to delete sensitive fields), see below.

The response object that you provide to the seneca-web plugin via a
Seneca action response, can contain a `http$` object to control the
HTTP response. This object can have the optional properties:

   * _status_: set the HTTP status code
   * _headers_: sub-object defining custom header values
   * _redirect_: redirect URL
   
For each HTTP method, you can provide a method specification that
overrides some of the route specification. Note that URL cannot be
modified at the method level - that would be a different route! In
particular this means that the _alias_ can onyl be set at the route
specification level. If you need other behaviour, your best option is
to write a custom middleware function, as noted above.

The method specification can contain the following properties, which
override the route specification:

    * _useparams_
    * _usequery_
    * _dataprop_
    * _handler_
    * _responder_
    * _modify_


## Handler Function

This function has the form: `function( req, res, args, act, respond )`, where:
     
   * _req_: express Request object
   * _res_: express Response object
   * _args_: Seneca action arguments derived from the HTTP request parameters
   * _act_: the Seneca action function, call with `act(args,respond)`
   * _respond_: call to return a result: `respond(err,out)`

Provide your own handler function when you need to customize the
behaviour of a route.


#### Responder Function

This function has the form: `function( req, res, err, out )`, where:

   * _req_: express Request object
   * _res_: express Response object
   * _err_: Seneca action error, if any
   * _out_: Seneca action result, if any

Provide your own responder function when you need to customize the
exact data of the HTTP response.


#### Modify Function

The output of a Seneca action is an object that is serialized to JSON
and returned over HTTP. It is normally necessary to remove unwanted
properties that should not appear to network clients. The default
modifier removes all properties that contain a `$`, as this is used by
Seneca for meta control. Provide your own modifer function to
customize this behavior.


#### General Middleware

At the top level, you can also provide general middleware functions
that get called before the mapping handlers are executed. These
functions allow you to perform shared operations, such as extracting a
cookie token, for example.

```
seneca.act('role:web', {use:{
  prefix: '/color',
  pin:    'role:color,cmd:*',
  startware: function(req,res,next){
    // attach something to each request
    req.foo = "bar"
    next()
  }
  map: {
    red: { POST:true }
  }
}})
```

These general middleware functions are:

   * _startware_: always executed, before any mappings, even when there is no route match
   * _endware_: executed only when a custom mapping middleware calls `next`.

The primary advantage of using the mapping specification over a custom
middleware function is that seneca-web maintains a list of mapped
routes, and also performance statistics for those routes. Each time
you call `role:web` you define a service, and the service defines a
number of routes.


#### Example Code

You can see some (admittedly terse) examples of mapping specifications
in the [test/test-server.js](test-server.js) and
[test/test-client.js](test-client.js) testing code, or in the example
applications noted above ([nodezoo.com](nodezoo.com) etc).


### `role:web,cmd:routes`

This command returns an array of all of the routes that have been defined.

```JavaScript
seneca.act('role:web, cmd:routes', function(err, routes) {
  console.log(routes);
});
```

Each route is described as an object with properties:

   * _url_: the route URL
   * _method_: the HTTP method
   * _srv_: the service that defined the route


### `role:web,cmd:list`

This command returns an array of all of the service functions that have been defined.

```JavaScript
seneca.act('role:web, cmd:list', function(err, services) {
  console.log(service);
});
```



## Test

```sh
npm test
```


