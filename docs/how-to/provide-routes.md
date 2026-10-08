# Provide routes

How to write a route plan that maps URLs to Seneca actions. The complete
schema is in the [route mapping reference](../reference/route-mapping.md).

A route plan is given in the `routes` option when the plugin loads, or
later with a message:

```js
seneca.use(SenecaWeb, { adapter, context, routes: plan })

seneca.act('role:web', { routes: plan }, function (err, reply) {
  // reply.routes lists the mapped routes
})
```

## Expose a plugin's actions

Name the actions with a `pin` whose `:*` stands for the varying part,
and list the ones to expose in `map`:

```js
const plan = {
  prefix: '/todo',
  pin: 'role:todo,cmd:*',
  map: {
    list: true, // GET /todo/list -> role:todo,cmd:list
    edit: { POST: true }, // POST /todo/edit -> role:todo,cmd:edit
  },
}
```

`true` (or any value that is not an object) gives a `GET` route. An
object chooses the methods: each of `GET`, `POST`, `PUT`, `HEAD`,
`DELETE`, `OPTIONS` and `PATCH` set as a property adds that method.

## Shape the path

| To get | Use |
| ------ | --- |
| A common first segment | `prefix` on the plan entry: `prefix: '/v1'`. |
| A common last segment | `postfix` on the plan entry: `postfix: '/:id'`. |
| A segment after the name on one route | `suffix` on the map value: `suffix: '/:id'`. |
| A different name in the path than in the pattern | `name` on the map value: `name: 'sign-in'` for the key `login`. |
| No name in the path at all | `name: ''`. |
| A fixed path, ignoring all of the above | `alias` on the map value: `alias: '/'`. |

The path is `/<prefix>/<name>/<postfix>/<suffix>`, or `/<alias>`.

## REST style paths

Combine `name: ''` with the HTTP methods and a `suffix` for the
identifier:

```js
const plan = {
  prefix: '/user',
  pin: 'role:user,cmd:*',
  map: {
    list: { GET: true, name: '' },
    load: { GET: true, name: '', suffix: '/:id' },
    create: { POST: true, name: '' },
    edit: { PUT: true, name: '', suffix: '/:id' },
    remove: { DELETE: true, name: '', suffix: '/:id' },
  },
}
```

| Method | Path | Pattern |
| ------ | ---- | ------- |
| GET | `/user` | `role:user,cmd:list` |
| GET | `/user/:id` | `role:user,cmd:load` |
| POST | `/user` | `role:user,cmd:create` |
| PUT | `/user/:id` | `role:user,cmd:edit` |
| DELETE | `/user/:id` | `role:user,cmd:remove` |

The route parameter is available to the action as `msg.args.params.id`
with the Express, Hapi and Koa adapters. A running version is
[`docs/examples/several-plugins.js`](../examples/several-plugins.js).

## Control the response

| To | Use |
| -- | --- |
| Send the action's reply as JSON | nothing: `autoreply` is `true` by default. |
| Write the response in the action | `autoreply: false`; the action uses `msg.response$`. |
| Redirect instead of replying | `redirect: '/somewhere'`. |

See [Handle errors and status codes](handle-errors-and-status-codes.md).

## Run framework code before the action

`middleware` on the plan entry or on a map value, and `auth` or `secure`
on a map value. See [Use custom middleware](use-custom-middleware.md)
and [Secure routes](secure-routes.md).

## Check a plan

Load the plugin without an adapter: the default log adapter prints the
mapped routes as JSON, with the `pattern` and `path` of each.
[`docs/examples/log-adapter.js`](../examples/log-adapter.js) does this
for the plan below and its output is listed in the
[route mapping reference](../reference/route-mapping.md#example).

```js
const plan = {
  pin: 'role:admin,cmd:*',
  prefix: '/v1',
  map: {
    home: { GET: true, POST: true, alias: '/home' },
    logout: { GET: true, redirect: '/' },
    profile: { GET: true, autoreply: false },
    login: { POST: true, auth: { strategy: 'local', pass: '/profile', fail: '/' } },
  },
}
```

| Methods | Path | Pattern |
| ------- | ---- | ------- |
| GET, POST | `/home` | `role:admin,cmd:home` |
| GET | `/v1/logout` | `role:admin,cmd:logout` |
| GET | `/v1/profile` | `role:admin,cmd:profile` |
| POST | `/v1/login` | `role:admin,cmd:login` |

## Things that do not work as you might expect

* A plan entry without `pin` is skipped silently, and so is a plan
  without `map`. Check the printed routes when something is missing.
* `map: { ping: false }` still creates a `GET /ping` route: only
  objects are inspected.
* The pattern is formed by replacing `:*` in the `pin` textually. A
  `pin` without `:*` gives every route the same pattern.
* Method names are passed to the adapter as written; use upper case.
