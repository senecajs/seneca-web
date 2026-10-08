# Exports reference

The plugin exports three functions through Seneca's export mechanism.
They are read with `seneca.export('web/<name>')` once the plugin has
loaded (inside `seneca.ready`, or from another plugin loaded afterwards).

| Export | Signature | Purpose |
| ------ | --------- | ------- |
| `web/mapRoutes` | `(msg, done)` | Map a route plan and register it with the adapter, exactly like the [`role:web,routes:*` message](messages.md#rolewebroutes). `msg.routes` is the route plan; `msg.adapter`, `msg.context`, `msg.options` and `msg.auth` are once off overrides. `done(err, reply)` receives the adapter's reply. |
| `web/setServer` | `(msg, done)` | Store a new adapter, context, auth and options, exactly like the [`role:web,set:server` message](messages.md#rolewebsetserver), and map `msg.routes` when given. |
| `web/context` | `()` | Return the current context (the `context` option, or the last one set with `set:server`). `null` when none was set. |

`mapRoutes` and `setServer` are the action functions themselves, bound
to the Seneca delegate that the plugin uses for adapters (a delegate of
the root instance, so that messages sent for web requests are not
fatal). Calling them directly does not go through pattern matching, so
`setServer` with `routes` always stores the server first and then maps
the routes.

## Example

```js
const seneca = Seneca()
  .use(SenecaWeb, { adapter: require('seneca-web-adapter-express'), context: Express() })

seneca.ready(function () {
  const app = seneca.export('web/context')()

  seneca.export('web/mapRoutes')({ routes: plan }, function (err, reply) {
    // reply.routes holds the mapped routes
    app.listen(3000)
  })
})
```

The complete, runnable version of this pattern is
[`docs/examples/several-plugins.js`](../examples/several-plugins.js),
which uses the message form.
