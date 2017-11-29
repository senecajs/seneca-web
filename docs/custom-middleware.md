# Applying Custom Middleware

Middleware allows you run functions that read from request and mutate the response prior to hitting the request handler for a given web framework.

Examples of middleware functions for the supported frameworks:

```js
// express / connect
route.middleware = (req, res, next) => { /* ...etc... */ }

// koa1
route.middleware = function * (next) => { /* ...etc... */ }

// koa2
route.middleware = async (ctx, next) => { /* ...etc... */ }

// hapi
route.middleware = async (request, h) => { /* ...etc... */ }
```

In `express` and `connect` - these are functions that are called prior to the request handler. `next` is called to move to the next middleware or request handler.

In `koa1` and  `koa2` - middleware requires a router with a `use` function.  Our tests run against `koa-router` but any similar routing libraries that expose `use` should work as well. Similar to `express` and `connect`, but you `yield next()` and `await next()` respectively.

In `hapi` - the middleware is attached as a `pre` option on the router. This allows for the same options and nested arrays that hapi supports.

There are two ways to provide custom middleware to a route:

## Applying through context

This is the easiest, but the middleware will be applied to all requestes mounted to seneca.web. You can provide context to `seneca-web`, and apply middleware by changing the context. For hapi, this can be an `onRequest` handler that runs with every request.

```js
// express family

const context = new Router()

// apply custom middleware to context
context.use((req, res, next) => { /* ...etc... */ })

seneca.use(SenecaWeb, {
  context,
  adapter: require('seneca-web-adapter-express')
})

seneca.ready(function () {
  const app = express()
  const router = this.export('web/context')()
  app.use('/api', router)
  app.listen(4000)
})

// hapi

const context = new Hapi.Server()
context.connection({port: 4000})

// apply custom middleware to all requests
context.ext({
  type: 'onRequest',
  method: function (request, h) { /*...etc...*/ }
})

seneca.use(SenecaWeb, {
  context,
  adapter: require('seneca-web-adapter-hapi')
})

seneca.ready(function () {
    const server = seneca.export('web/context')()
    server.start()
})

```

## Using defined middleware

You can define an object under `middleware` key in the SenecaWeb options. The middleware will be an object with key as middleware name and value as middleware function, as follows:

### Using string keys

```js
seneca.use(SenecaWeb, {
   middleware = {
    'middleware1': (req, res, next) => {  /*...etc... */ },
    'middleware2': (req, res, next) => { /*...etc...*/ }
   }
})
```

Then you can specify certain route to use specific middleware as follows;

```js
{
  "routes": [
    {
      pin: 'role:api,cmd:*',
      map: {
        ping: {
          GET: true,
          middleware: ['middleware1', 'middleware2']
        },
        ping: {
          GET: true,
          middleware: 'middleware1'
        }
      }
    }
  ]
}
```

* When `/ping` is requested, `middleware1` and `middleware2` will be run prior to the seneca action and response handling.
* When `/pong` is requested, only `middleware1` will be run.

### Using functions

You can provide the `middleware` key as a function in a prior action. Prior actions allow you to proxy requests to other actions, modify the arguments and call the action normally.  In the following, you can add middleware and call the regular `role:web,routes:*` action. This can allow you to specify a more specific pin and attach middleware before the routes make their way into `seneca-web`:

```js
seneca.use(SenecaWeb, {...etc})
seneca.ready(function () {
  seneca.add('role:web,special:true,routes:*', function (msg, cb) {
    msg.routes.middleware = () => { /* ...etc... */ }
    this.prior(msg, cb)
  })
})
```
