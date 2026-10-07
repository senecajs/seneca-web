# Messages reference

The action patterns the plugin adds. The messages take the same route
plans as the `routes` option; see the [route mapping reference](route-mapping.md).

## `role:web,routes:*`

Map a route plan and register the mapped routes with the adapter. The
pattern matches any message with `role:web` and a `routes` property, so
the usual form is `seneca.act('role:web', { routes: plan }, callback)`.

| Property | Type | Required | Effect |
| -------- | ---- | -------- | ------ |
| `routes` | object or array | yes | The route plan. |
| `adapter` | function | no | Adapter to use for this message only. Default: the stored adapter. |
| `context` | any | no | Context to use for this message only. Default: the stored context. |
| `options` | object | no | Adapter options for this message only (replaces, does not merge). Default: the stored options. |
| `auth` | any | no | Auth provider for this message only. Default: the stored auth. |

**Reply**: whatever the adapter passes to `done`. The log adapter replies
`{ ok: true, routes }`; the Express, Hapi, Connect and Koa adapters reply
`{ routes }`. `routes` is the array of [mapped routes](route-mapping.md#mapped-route).

**Errors**: whatever the adapter passes to `done`, or throws while
registering routes (Seneca turns an exception in the action into an
error reply). The published adapters reply `no context provided` when
there is no context; the Express and Connect adapters throw
`expected valid middleware, got <value>` for a middleware name that is
not defined in the `middleware` option. On Seneca 4 the callback
receives the adapter's error object; on Seneca 3 it is wrapped
(`err.orig` is the adapter's error). See
[Seneca 3 and 4](../explanation/seneca-3-and-4.md).

The message values given here are used once and are not stored; use
`role:web,set:server` to change them for later messages.

## `role:web,set:server`

Store a new adapter, context, auth provider and adapter options, and
optionally map routes with them. Properties that are not given keep
their current values.

| Property | Type | Required | Effect |
| -------- | ---- | -------- | ------ |
| `adapter` | function | no | The new adapter. |
| `context` | any | no | The new context, returned by `web/context` from now on. |
| `options` | object | no | The new adapter options (replaces, does not merge). |
| `auth` | any | no | The new auth provider. |
| `routes` | object or array | no | A route plan to map with the new values. |

**Reply**: `{ ok: true }` when no `routes` were given; otherwise the
adapter's reply, as for `role:web,routes:*`.

**Errors**: `Provide a function as adapter` when the resulting adapter
is not a function (for example a string); nothing is stored in that
case. With `routes`, the adapter's errors as above.

A `set:server` message that carries `routes` matches the pattern
`role:web,set:server,routes:*`, which the plugin adds for this purpose
(version 2.3.0 and later). Earlier versions dispatched such a message to
`role:web,routes:*`, so the new server was used once but not stored.

The context given with this message is not inspected by Seneca's plugin
loader, so this is the way to pass a context object with circular
references, such as a Hapi server; see [Options](options.md).

## `init:web`

The plugin's initialization action, called by Seneca once the plugin is
defined. It stores the `adapter`, `context`, `auth` and `options`
options as the current server and maps the `routes` option. It is not
meant to be called by applications; call `role:web,set:server` instead.
Because Seneca sends plugin init messages with `fatal$: true`, an error
here (for example an adapter that is not a function) is fatal and stops
the process.

## Messages sent by adapters

For every web request, the adapter sends one message to the action
pattern of the mapped route. Its shape is described in the
[request mapping reference](request-mapping.md). The adapter sends it
with the Seneca instance the plugin gave it: a delegate of the root
instance, so that these messages are not fatal and each one starts its
own transaction.
