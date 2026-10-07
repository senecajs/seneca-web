# Adapter contract reference

An adapter connects the plugin to one web framework. The plugin maps
route plans into mapped routes and hands them to the adapter; the
adapter registers a handler for each route with the framework, and in
that handler sends a Seneca message for every request. This page
specifies the contract. A complete minimal adapter is
[`docs/examples/write-an-adapter.js`](../examples/write-an-adapter.js);
the guide [Write an adapter](../how-to/write-an-adapter.md) walks
through it.

## Signature

```js
module.exports = function adapter(options, context, auth, routes, done) {
  const seneca = this
  ...
  done(null, { routes: routes })
}
```

The plugin calls it as `adapter.call(seneca, options, context, auth,
routes, done)`:

| Argument | Content |
| -------- | ------- |
| `this` | A Seneca instance to send messages with: a delegate of the root instance with `plugin$: { name: 'web' }` fixed. Messages sent with it are not fatal and each starts a new transaction. Keep a reference for the request handlers. |
| `options` | The adapter options: the plugin's `options` option deep merged over `{ parseBody: true }`, plus `middleware` (the named middleware map) when the `middleware` option was given. A `role:web,routes:*` message may replace it for one call. |
| `context` | The framework object to register routes on (the `context` option or the one set with `set:server`, or a once off value from the message). May be `null`; the published adapters reply with the error `no context provided` then. |
| `auth` | The auth provider (the `auth` option), or `null`. Its meaning is up to the adapter. |
| `routes` | The array of [mapped routes](route-mapping.md#mapped-route). |
| `done` | Callback `(err, reply)`. Call it exactly once, after all routes are registered. Reply `{ routes }` by convention. |

The adapter is called once per `role:web,routes:*` or `set:server`
message and once at plugin initialization for the `routes` option. It
may be called several times with the same context; each call adds the
routes it receives.

## For each mapped route

1. Resolve `route.middleware`: strings name functions in
   `options.middleware`; functions are used as they are. The Express and
   Connect adapters throw `expected valid middleware, got <value>` when
   a name is unknown, which fails the mapping message.
2. For each name in `route.methods`, register a handler for
   `route.path` with the framework. Method names are as written in the
   route plan (normally upper case); lower case them if the framework
   needs that.
3. Honour `route.auth` and `route.secure` if the framework supports
   them, otherwise document that they are ignored.

## For each request

1. Build the message as specified in the
   [request mapping reference](request-mapping.md): `args` with `body`,
   `query`, `params`, `route` and anything else useful, plus `request$`
   and `response$`.
2. Send it: `seneca.act(route.pattern, message, callback)`.
3. In the callback: on error, hand the error to the framework's error
   handling (on Seneca 4 `err` is the action's error, on Seneca 3 the
   action's error is `err.orig`); otherwise redirect when
   `route.redirect` is set; otherwise send the reply when
   `route.autoreply` is `true`; otherwise do nothing, the action has
   responded through `response$`.

## The log adapter

`lib/adapters/log.js` is the default adapter and the smallest example of
the contract. It ignores `context` and `auth`, prints
`JSON.stringify({ routes }, null, 2)` to the console (or calls
`options.sink(routes)` when `sink` is a function) and replies
`{ ok: true, routes }`.

## Publishing an adapter

The published adapters are named `seneca-web-adapter-<framework>` and
declare `"peerDependencies": { "seneca-web": "^1.0.0 || ^2.0.0" }`.
They do not require `seneca-web` themselves; the application loads the
plugin and passes the adapter in the `adapter` option. An adapter has no
Seneca version dependency of its own beyond the error shape described
above.
