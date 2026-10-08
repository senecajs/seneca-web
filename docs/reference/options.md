# Options reference

The options passed to `seneca.use(SenecaWeb, options)`. All of them are
optional; the plugin starts with the log adapter when none are given.

```js
seneca.use(SenecaWeb, {
  adapter: require('seneca-web-adapter-express'),
  context: app,
  auth: passport,
  routes: [...],
  options: { parseBody: false },
  middleware: { requireKey: fn },
})
```

| Option | Type | Default | Effect |
| ------ | ---- | ------- | ------ |
| `adapter` | function | the log adapter | The adapter that registers mapped routes with a web framework. It is called as `adapter.call(seneca, options, context, auth, routes, done)`, see the [adapter contract](adapter-contract.md). Anything that is not a function fails plugin initialization with the error `Provide a function as adapter`; passing the name of an adapter as a string was removed in version 2.0.0. |
| `context` | any | `null` | The framework object that the adapter registers routes on: an Express application or router, a Hapi server, a Koa router, a Connect application. It is passed to the adapter as it is, and returned by `seneca.export('web/context')()`. |
| `auth` | any | `null` | An authentication provider, passed to the adapter as it is. The Express adapter expects an object with a Passport style `authenticate(strategy, options)` method; see [Secure routes](../how-to/secure-routes.md). |
| `routes` | object or array | `null` | A [route plan](route-mapping.md) mapped when the plugin initializes. Further routes can be mapped later with the [`role:web,routes:*` message](messages.md). |
| `options` | object | `{ parseBody: true }` | Adapter options. The object is deep merged with the default and passed to the adapter as its first argument. Which properties are read depends on the adapter; the ones used by the published adapters are listed below. |
| `middleware` | object | none | Named middleware: an object whose keys are names and whose values are middleware functions of the framework. It is stored as `options.middleware`, so that route plans can refer to middleware by name. See [Use custom middleware](../how-to/use-custom-middleware.md). |

The plugin does not validate these options (it has no `defaults`
declaration). Seneca itself walks the plugin options when the plugin
loads, so `context` and `auth` objects that contain circular references
(for example a Hapi server) can not be given through `use()`: they hang
or fail plugin loading on Seneca 3.38 and 4. Pass such objects with the
`role:web,set:server` message or the `web/setServer` export after the
plugin has loaded instead; Express applications and routers are
functions and are fine.

## Adapter options

Properties of `options` read by the published adapters.

| Property | Default | Adapters | Effect |
| -------- | ------- | -------- | ------ |
| `parseBody` | `true` | express, connect, koa2 | When `true`, the adapter reads the raw request body itself and passes it as a string in `args.body`. Set it to `false` when the framework parses bodies (for example `app.use(express.json())`), so that `args.body` is the parsed object. With `express.json()` installed and `parseBody` still `true`, the adapter waits for a body stream that has already been consumed and the request never completes. |
| `includeRequest` | `true` | express | Attach the framework request as `request$` to the message. |
| `includeResponse` | `true` | express | Attach the framework response as `response$` to the message. |
| `middleware` | none | express, connect, koa2 | The named middleware map, set from the `middleware` option above. |
| `sink` | none | log | A function called with the mapped routes instead of printing them to the console. |

## One configuration per process

The plugin keeps its configuration (`adapter`, `context`, `auth`,
`options`, `routes`) in module level variables, not per Seneca instance.
Consequences, verified with version 2.3.0 on Seneca 4.0.0-rc5:

* Options from several `use()` calls in one process are merged, property
  by property, later calls winning. In particular a later instance that
  gives no `routes` maps the routes of the earlier one, on its own
  context, and `routes` arrays are merged element by element.
* `role:web,set:server` and `web/setServer` change the server used by
  every instance in the process; `web/context` of every instance returns
  the same object.

Load the plugin once per process, or give every instance the complete
configuration, including `routes` (use `routes: null` for none).
