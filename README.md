# seneca-web

## A HTTP utility plugin for the [Seneca](http://senecajs.org) toolkit


DOCUMENTATION IN PROGRESS

There are many examples of usage however - see [seneca-examples](http://github.com/rjrodger/seneca-examples) and
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

## Support

If you're using this module, feel free to contact me on Twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.2.2

Tested on: Node 0.10.29, Seneca 0.5.19



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


