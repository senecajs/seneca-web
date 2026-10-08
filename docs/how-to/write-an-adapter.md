# Write an adapter

How to connect the plugin to a web framework that has no published
adapter, or to replace the request handling of an existing one. The
contract is specified in the
[adapter contract reference](../reference/adapter-contract.md); the
complete program is
[`docs/examples/write-an-adapter.js`](../examples/write-an-adapter.js),
an adapter for Node's own `http` module.

## 1. Write the adapter function

The plugin calls `adapter.call(seneca, options, context, auth, routes,
done)`. Register one handler per route and method on the context, then
call `done`:

```js
function httpAdapter(options, context, auth, routes, done) {
  const seneca = this

  for (const route of routes) {
    for (const method of route.methods) {
      context.table[method + ' ' + route.path] = function handle(req, res, body) {
        ...
      }
    }
  }

  done(null, { routes: routes })
}
```

Keep `this`: it is the Seneca instance to send messages with. Reply
`{ routes }` so that callers of `role:web` see what was mapped. Call
`done(err)` when the context is unusable.

## 2. Turn each request into a message

Build `args` from the request, add `request$` and `response$`, and send
the message to `route.pattern`:

```js
const url = new URL(req.url, 'http://localhost')

const msg = {
  args: {
    body: body,
    query: Object.fromEntries(url.searchParams),
    params: {},
    route: route,
  },
  request$: req,
  response$: res,
}

seneca.act(route.pattern, msg, function (err, out) { ... })
```

Follow the [request mapping reference](../reference/request-mapping.md)
for the property names, so that actions written for one adapter work
with another. Put framework objects only in `$` properties: they are
removed when the message travels over a transport, and `args` must stay
serializable.

## 3. Turn the reply into a response

In the callback, in this order:

```js
seneca.act(route.pattern, msg, function (err, out) {
  res.setHeader('content-type', 'application/json')
  if (err) {
    // Seneca 4 hands back the error the action replied with.
    res.statusCode = 500
    return res.end(JSON.stringify({ error: err.message }))
  }
  if (route.redirect) {
    res.statusCode = 302
    res.setHeader('location', route.redirect)
    return res.end()
  }
  if (route.autoreply) {
    res.end(JSON.stringify(out))
  }
  // autoreply false: the action has responded through response$
})
```

On Seneca 3 the error is wrapped and the action's error is `err.orig`;
adapters that support both use `(err.orig || err)`. Do not expect
`err.orig` on Seneca 4.

## 4. Honour the rest of the route

* `route.middleware`: an array of functions and names; names refer to
  `options.middleware[name]`. Run them before the handler if the
  framework has the concept, and fail (throw) on an unknown name.
* `route.auth` and `route.secure`: implement them if the framework has
  authentication, otherwise document that they are ignored.
* `options.parseBody`: read the body yourself when `true`, use the
  framework's parsed body when `false`.

## 5. Try it

```js
const seneca = Seneca({ log: 'warn' })
  .use(demo)
  .use(SenecaWeb, {
    adapter: httpAdapter,
    context: context,
    routes: { pin: 'role:demo,cmd:*', map: { hello: true, fail: true } },
  })

seneca.ready(function () {
  const server = Http.createServer(context.listener)
  server.listen(3000)
})
```

Output of the example (the Seneca error log line is shortened):

```
routes: [ 'GET /hello', 'GET /fail' ]
GET /hello?name=adapter -> 200 { hello: 'adapter' }
{"notice":"this action always fails", ... "kind":"act","case":"ERR", ...}
GET /fail -> 500 { error: 'this action always fails' }
closed
```

## 6. Publish it

Name the package `seneca-web-adapter-<framework>`, export the adapter
function as the module, and declare
`"peerDependencies": { "seneca-web": "^1.0.0 || ^2.0.0" }`. The adapter
does not need to require `seneca-web` or `seneca`. Test it with a real
server on `127.0.0.1` and close the server and the Seneca instance at
the end of every test.
