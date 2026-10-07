# Map several plugins under prefixes

How to expose the actions of several plugins on one server, each under
its own URL prefix, and how to add routes while the server runs. The
program is [`docs/examples/several-plugins.js`](../examples/several-plugins.js).

## 1. One plan entry per plugin

A route plan is an array; give each plugin its own entry with its own
`pin` and `prefix`:

```js
const routes = [
  {
    prefix: '/todo',
    pin: 'role:todo,cmd:*',
    map: {
      list: { GET: true, name: '' }, //   GET  /todo
      load: { GET: true, name: '', suffix: '/:id' }, // GET /todo/:id
      create: { POST: true, name: '' }, // POST /todo
    },
  },
  {
    prefix: '/admin',
    pin: 'role:admin,cmd:*',
    map: {
      status: true, // GET /admin/status
    },
  },
]
```

Nothing ties an entry to a plugin: the `pin` names patterns, and any
plugin (or several) may implement them.

## 2. Load the plugins and the web plugin

```js
const app = Express()
app.use(Express.json())

const seneca = Seneca({ log: 'warn' })
  .use(todo)
  .use(admin)
  .use(SenecaWeb, {
    adapter: require('seneca-web-adapter-express'),
    context: app,
    routes: routes,
    options: { parseBody: false },
  })
```

The order of `use` calls does not matter for routing: the routes are
registered when the web plugin initializes, and messages for actions
that are not yet defined wait until the instance is ready.

## 3. Add routes at runtime

Any time after the plugin has loaded, send a `role:web` message with
more routes. They are registered on the same context:

```js
seneca.add('role:admin,cmd:version', function (msg, reply) {
  reply({ version: require('./package.json').version })
})

seneca.act('role:web', {
  routes: { prefix: '/admin', pin: 'role:admin,cmd:*', map: { version: true } },
}, function (err, reply) {
  // reply.routes: the newly mapped routes
})
```

This is how a plugin can register its own routes: it loads after the
web plugin and sends the message from its definition function or its
init.

Output of the example:

```
GET /todo -> 200 [ { id: 1, text: 'write docs' } ]
POST /todo -> 200 { id: 2, text: 'run the examples' }
GET /todo/2 -> 200 { id: 2, text: 'run the examples' }
GET /admin/status -> 200 { ok: true, uptime: 0 }
GET /admin/version -> 200 { version: '2.3.0' }
closed
```

## Mount everything under one path

With Express, use a router as the context and mount it where you like:

```js
const router = Express.Router()

seneca.use(SenecaWeb, { adapter: require('seneca-web-adapter-express'), context: router, routes })

seneca.ready(function () {
  app.use('/api', seneca.export('web/context')())
  app.listen(3000) // GET /api/todo, GET /api/admin/status
})
```

The adapter calls `router.get(path, handler)` just as it would on an
application, so the plan does not change.

## Several servers in one process

The plugin keeps one configuration per process (see
[Options](../reference/options.md#one-configuration-per-process)). To
register routes on a second context, pass it with the message instead
of loading the plugin twice:

```js
seneca.act('role:web', { routes: adminRoutes, context: adminApp }, cb)
```

The `context` given in a message is used for that message only.
