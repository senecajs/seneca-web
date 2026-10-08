# Use custom middleware

How to run framework middleware (authentication checks, logging, header
handling) before the Seneca action of a route. The program is
[`docs/examples/custom-middleware.js`](../examples/custom-middleware.js).

Middleware is a framework concept, so the functions are written for the
framework of the adapter:

```js
// express, connect
function (req, res, next) { ...; next() }

// koa2
async function (ctx, next) { ...; await next() }
```

The Express and Connect adapters and the Koa 2 adapter run route
middleware; the Hapi adapter (1.0.2) ignores the `middleware` property.

## 1. Define named middleware once

Give the plugin a `middleware` option: an object whose keys are names
and whose values are functions.

```js
const middleware = {
  requireKey: function (req, res, next) {
    if ('secret' !== req.headers['x-api-key']) {
      return res.status(401).json({ error: 'missing or wrong x-api-key' })
    }
    req.apiKey = req.headers['x-api-key']
    next()
  },
  stamp: function (req, res, next) {
    req.time = 'a fixed time stamp'
    next()
  },
}

seneca.use(SenecaWeb, {
  adapter: require('seneca-web-adapter-express'),
  context: app,
  routes: routes,
  middleware: middleware,
})
```

## 2. Refer to it from the route plan

By name, on the plan entry (for every route of the entry) or on a map
value (for that route). A single name or an array of names works. The
entry's middleware runs first, then the route's.

```js
const routes = {
  pin: 'role:api,cmd:*',
  middleware: 'stamp',
  map: {
    ping: { GET: true, middleware: ['requireKey'] },
    time: {
      GET: true,
      middleware: function (req, res, next) {
        res.set('x-example', 'custom-middleware')
        next()
      },
    },
  },
}
```

Functions can be given directly, as for `time`. A name that is not in
the `middleware` option makes the Express and Connect adapters throw
`expected valid middleware, got <name>`, which fails the mapping
message (or plugin initialization, when the plan is in the options).

Output of the example:

```
GET /ping (no key) -> 401 { error: 'missing or wrong x-api-key' }
GET /ping (with key) -> 200 { pong: true, key: 'secret' }
GET /time -> 200 { time: 'a fixed time stamp' } x-example: custom-middleware
closed
```

The action behind `/ping` read `msg.request$.apiKey`, set by the
middleware: `request$` is the same request object the middleware saw.

## Middleware for every route

Middleware that should run for all requests belongs on the framework
object itself, before the routes are mapped:

```js
const app = Express()
app.use(function (req, res, next) { ...; next() })
seneca.use(SenecaWeb, { adapter, context: app, routes })
```

With Hapi, use a server extension (`server.ext('onRequest', fn)`) on
the server passed as context.

## Add middleware from a prior action

Routes mapped by other code can be given middleware by adding a prior
on the mapping pattern, changing the plan, and calling the original
action:

```js
seneca.add('role:web,routes:*', function (msg, done) {
  for (const entry of [].concat(msg.routes)) {
    entry.middleware = [].concat(entry.middleware || [], 'stamp')
  }
  this.prior(msg, done)
})
```

Add the prior after the web plugin has loaded (for example in a plugin
loaded later) so that it wraps the plugin's action.
