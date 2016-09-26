![Seneca][Logo]

# seneca-web
[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]
[![Gitter chat][gitter-badge]][gitter-url]

- __Sponsor:__ [nearForm][Sponsor]
- __Node:__ 4.x, 6.x
- __Seneca:__ 1.x - 3.x


This plugin allows http requests to be mapped to seneca actions. Http actions handled
locally can access the raw `request` and `response` objects. Actions handled over
transport can access a reduced set of request data including payloads and headers.

If you're using this module, and need help, you can:

- Post a [github issue][],
- Tweet to [@senecajs][],
- Ask on the [Gitter][gitter-url].

If you are new to Seneca in general, please take a look at [senecajs.org][]. We have
everything from tutorials to sample apps to help get you up and running quickly.


## Install
```
npm install seneca-web
```

## Test
To run tests locally,

```
npm run test
```

To obtain a coverage report,

```
npm run coverage; open docs/coverage.html
```

## Quick example
__Route map__
```js
var Routes = [{
  pin: 'role:admin,cmd:*',
  prefix: '/v1',
  postfix: '/?param=true'
  map: {
    home: {
      GET: true,
      POST: true,
      alias: '/home'
    },
    logout: {
      GET: true,
      redirect: '/'
    },
    profile: {
      GET: true,
      autoreply: false
    },
    login: {
      POST: true,
      auth: {
        strategy: 'local',
        pass: '/profile',
        fail: '/'
      }
    }
  }
}]
```

__Hapi__
```js
'use strict'

var Hapi = require('hapi')
var Seneca = require('seneca')
var Web = require('../../')
var Routes = require('./common/routes')
var Plugin = require('./common/plugin')

var config = {
  routes: Routes,
  adapter: 'hapi',
  context: (() => {
    var server = new Hapi.Server()
    server.connection({port: 4000})
    return server
  })()
}

var seneca = Seneca()
  .use(Plugin)
  .use(Web, config)
  .ready(() => {
    var server = seneca.export('web/context')()

    server.start(() => {
      console.log('server started on: ' + server.info.uri)
    })
  })
```

__Express__
```js
'use strict'

var Seneca = require('seneca')
var Express = require('Express')
var Web = require('../../')
var Routes = require('./common/routes')
var Plugin = require('./common/plugin')

var config = {
  routes: Routes,
  adapter: 'express',
  context: Express()
}

var seneca = Seneca()
  .use(Plugin)
  .use(Web, config)
  .ready(() => {
    var server = seneca.export('web/context')()

    server.listen('4000', () => {
      console.log('server started on: 4000')
    })
  })

```

__Connect__
```js
'use strict'

var Seneca = require('seneca')
var Connect = require('connect')
var Http = require('http')
var Web = require('../../')
var Routes = require('./common/routes')
var Plugin = require('./common/plugin')

var config = {
  routes: Routes,
  adapter: 'connect',
  context: Connect()
}

var seneca = Seneca()
  .use(Plugin)
  .use(Web, config)
  .ready(() => {
    var connect = seneca.export('web/context')()
    var http = Http.createServer(connect)

    http.listen(4060, () => {
      console.log('server started on: 4060')
    })
  })

```

## Action Patterns

### role:web,route:*
Define a web service as a mapping from URL routes to action patterns.

```js
seneca.act('role:web', {routes: Routes}, (err, reply) => {
  console.log(err || reply.routes)
})
```

## Exported Methods

### context
Provides the current context so it can be used to start the server or
add custom logic, strategies, or middleware.

```js
var seneca = Seneca()
  .use(Plugin)
  .use(Web, config)
  .ready(() => {

    // This will be whatever server is being used.
    // seneca-web doesn't autostart the server, it
    // must first be exported and then started.
    var context = seneca.export('web/context')()
  })
```

### mapRoutes
Allows routes to be mapped outside of using seneca directly. Provides the
same functionality as `role:web,route:*`.

```js
var seneca = Seneca()
  .use(Plugin)
  .use(Web, config)
  .ready(() => {

    // Provides the same functionality as seneca.act('role:web', {routes ...})
    // can be used to add more routes at runtime without needing seneca.
    seneca.export('web/mapRoutes')(Routes, (err, reply) => {
      ...
    })
  })
```

### setServer
Allows the server and adapter to be swapped out after runtime.

```js
var seneca = Seneca()
  .use(Plugin)
  .use(Web, config)
  .ready(() => {

    var config = {
      context: Express(),
      adapter: 'express',
      routes: Routes
    }

    // Provides the same functionality as seneca.act('role:web', {routes ...})
    // can be used to add more routes at runtime without needing seneca.
    seneca.export('web/setServer')(config, (err, reply) => {
      ...
    })
  })
```

## Auth
Both Hapi and Express support secure routing. Hapi support is via it's built in
auth mechanism and allows Bell and custom strategies. Express auth is provided
via passport, which supports 100s of strategies.

__Secure Express routes__
```js
map: {
  home: {
    GET: true,
    POST: true,
    alias: '/'
  },
  logout: {
    GET: true,
    redirect: '/'
  },
  profile: {
    GET: true,
    secure: {
      fail: '/'
    }
  },
  login: {
    POST: true,
    auth: {
      strategy: 'local',
      pass: '/profile',
      fail: '/'
    }
  }
```

Express routes use `auth` for `passport.authorize` and `secure` for checking the
existence of `request.user`. Both secure and auth guards support fail redirects. Auth
also supports pass routing.

__Secure Hapi routes__
```js
map: {
  home: {
    GET: true,
    POST: true,
    alias: '/'
  },
  profile: {
    GET: true,
    auth: {
      strategy: 'simple',
      fail: '/'
    }
  },
  admin: {
    GET: true,
    auth: {
      strategy: 'simple',
      pass: '/profile',
      fail: '/'
    }
  }
}
```
Hapi routes do not use the `secure` option. All routes are secured using `auth`. Both
pass and fail redirects are supported.

## Body Parser

If a body parser has not been provided using express or connect, seneca-web will attempt
to parse the body. This will not work if a body-parser has already been defined for the app.
To disable this behavior, pass `{options: {parseBody: false}}` to the plugin options.

## Examples
A number of examples showing basic and secure usage for hapi and express as well as
showing connect and log usage are provided in [./docs/examples](). Examples include,

- Logging routes when building maps (via log adapter).
- Basic expres, hapi, and connect usage.
- Securing Express and Hapi routes.
- Proxying some routes over to transport

## Contributing
The [Senecajs org][] encourage open participation. If you feel you can help in any way,
be it with documentation, examples, extra testing, or new features please get in touch.


## License
Copyright (c) 2013 - 2016, Richard Rodger and other contributors.
Licensed under [MIT][].

[Sponsor]: http://nearform.com
[Logo]: http://senecajs.org/files/assets/seneca-logo.png
[npm-badge]: https://badge.fury.io/js/seneca-web.svg
[npm-url]: https://badge.fury.io/js/seneca-web
[travis-badge]: https://api.travis-ci.org/senecajs/seneca-web.svg
[travis-url]: https://travis-ci.org/senecajs/seneca-web
[coveralls-badge]:https://coveralls.io/repos/senecajs/seneca-web/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/senecajs/seneca-web?branch=master
[david-badge]: https://david-dm.org/senecajs/seneca-web.svg
[david-url]: https://david-dm.org/senecajs/seneca-web
[gitter-badge]: https://badges.gitter.im/senecajs/seneca.png
[gitter-url]: https://gitter.im/senecajs/seneca
[MIT]: ./LICENSE
[Senecajs org]: https://github.com/senecajs/
[Seneca.js]: https://www.npmjs.com/package/seneca
[senecajs.org]: http://senecajs.org/
[github issue]: https://github.com/senecajs/seneca-web/issues
[@senecajs]: http://twitter.com/senecajs
