# Handle errors and status codes

How action errors become HTTP responses, how to pick the status code,
and how to write a response yourself. The program is
[`docs/examples/errors-and-status.js`](../examples/errors-and-status.js).

## What the adapter does with an error

When the action replies with an error (or throws), the adapter hands it
to the framework:

| Adapter | On error |
| ------- | -------- |
| express, connect | `next(err)`: the framework's error handling; without a handler Express responds 500 with its default page |
| koa2 | the route handler rejects: Koa's error handling, status 500 by default |
| hapi | `reply(err)` |

On Seneca 4 the error object is the one the action produced: `err.message`
and `err.code` are the action's, and Seneca's own description of the
failure is attached as `err.meta$`. On Seneca 3 the adapter receives a
wrapper: `err.message` is `seneca: Action <pattern> failed: <message>.`
and the action's error is `err.orig`. Code that must run on both reads
`(err.orig || err)`.

## 1. Give errors a code

```js
this.add('role:shop,cmd:item', function (msg, reply) {
  const id = msg.args.params.id
  if ('1' !== id) {
    const err = new Error('item ' + id + ' not found')
    err.code = 'not_found'
    return reply(err)
  }
  reply({ id: 1, name: 'kiwi' })
})
```

Inside a plugin, `this.error(code, details)` with a plugin `errors` map
produces errors with a `code` in the same way.

## 2. Map codes to status codes (Express)

Add an Express error handler **after the routes are mapped**. Express
only passes errors to handlers added after the failing route, and the
plugin adds its routes while it loads, so add the handler inside
`seneca.ready` (or after a `role:web` message has replied):

```js
seneca.ready(function () {
  app.use(function (err, req, res, next) {
    const orig = err.orig || err
    const status = 'not_found' === orig.code ? 404 : 500
    res.status(status).json({ error: orig.message, code: orig.code })
  })

  app.listen(3000)
})
```

## 3. Write the response yourself

For a status code or a body that is not the action's reply, turn
`autoreply` off and use `response$`:

```js
// route: order: { POST: true, autoreply: false }
this.add('role:shop,cmd:order', function (msg, reply) {
  msg.response$.status(201).json({ ordered: msg.args.body.item })
  reply()
})
```

The action still replies (with nothing) so that the message completes;
the adapter sends no response of its own. `response$` is removed from
messages that travel over a transport, so this only works for actions
running in the web process.

## 4. Redirect

```js
// route: old: { GET: true, redirect: '/shop/item/1' }
```

The adapter redirects (status 302 with Express) after the action
replies; the reply itself is discarded.

## Output

```
GET /shop/item/1 -> 200 { id: 1, name: 'kiwi' }
{"notice":"item 2 not found","code":"not_found","err":{...},"kind":"act","case":"ERR",...}
GET /shop/item/2 -> 404 { error: 'item 2 not found', code: 'not_found' }
POST /shop/order -> 201 { ordered: 'kiwi' }
GET /shop/old -> 302 location: /shop/item/1
closed
```

The second line (shortened here) is Seneca's own log entry: every
action error is logged at level `error` whatever the HTTP response. Set
`log: 'silent'` or a logger to change that.

## Errors while mapping routes

A `role:web` message fails when the adapter fails: `no context
provided`, or `expected valid middleware, got <name>`. Such an error
reaches the `act` callback like any action error. When the plan is in
the plugin options, the same failure is fatal, because Seneca runs
plugin initialization with `fatal$`; the process logs the error and
exits. Check the plan with the log adapter first.

## Before version 2.3.0

Routes given in the plugin options sent fatal request messages (the
adapter inherited the `fatal$` flag of the plugin init), so an action
error during a request closed the Seneca instance and exited the
process, on Seneca 3 and 4. Version 2.3.0 calls adapters with a delegate
of the root instance, and request errors are ordinary action errors.
