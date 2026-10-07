# Route mapping reference

A *route plan* describes which URLs map to which Seneca messages. The
mapper (`lib/mapper.js`) turns a route plan into a list of *mapped
routes*, which the adapter registers with the web framework. This page
specifies both. For a guided introduction see
[Provide routes](../how-to/provide-routes.md); for the ideas behind the
design see [How routes become patterns](../explanation/how-routes-become-patterns.md).

A route plan is accepted by the `routes` [option](options.md), by the
[`role:web,routes:*` and `role:web,set:server` messages](messages.md),
and by the exported `web/mapRoutes` and `web/setServer`
[functions](api.md). It is either one *plan entry* or an array of them;
nested arrays are flattened.

## Plan entry

| Property | Type | Required | Effect |
| -------- | ---- | -------- | ------ |
| `pin` | string | yes | The pattern of the actions to expose, with `:*` marking the property that each map key fills in, for example `role:todo,cmd:*`. Entries without a `pin` are skipped silently. |
| `map` | object | yes | One property per route: the key names the action and the value configures the route (below). Without a `map`, nothing is mapped. |
| `prefix` | string | no | Path segment placed before the route name on every route of the entry, for example `/api` or `api`. |
| `postfix` | string | no | Path segment placed after the route name on every route of the entry. |
| `middleware` | string, function or array of them | no | Middleware for every route of the entry. Strings name middleware defined in the `middleware` option; functions are used as they are. See [Use custom middleware](../how-to/use-custom-middleware.md). |

## Map values

The key of each `map` property is the *route name*. It replaces `:*` in
the `pin` to form the action pattern: `pin: 'role:todo,cmd:*'` with the
key `list` gives `role:todo,cmd:list`. Note that the replacement is
textual: it replaces the first `:*` only, and a `pin` without `:*`
produces the same pattern for every key.

The value is either an object or anything else:

* A value that is not an object (`true`, but also `false`, `0` or a
  string) creates a route for the `GET` method only, at
  `/<prefix>/<name>/<postfix>`.
* An object configures the route with the properties below.

| Property | Type | Default | Effect |
| -------- | ---- | ------- | ------ |
| `GET`, `POST`, `PUT`, `HEAD`, `DELETE`, `OPTIONS`, `PATCH` | any | none | Each property whose name is one of these HTTP methods adds that method to the route; the value is ignored. Method names are matched case insensitively, but are passed to the adapter as written, so write them in upper case. Any other property name is not a method. A route object with no method has an empty `methods` list and the adapter registers nothing for it. |
| `alias` | string | `false` | Replaces the whole path: `prefix`, name, `postfix` and `suffix` are ignored and the path is `/<alias>`. |
| `name` | string | the map key | Overrides the route name used in the path (not in the pattern). An empty string removes the name from the path, which gives REST style paths such as `/todo` and `/todo/:id`. |
| `suffix` | string | `false` | Path segment placed after `postfix`, for example `/:id` for a route parameter. |
| `autoreply` | boolean | `true` | When `true`, the adapter sends the action's reply as the HTTP response. When `false`, the action must respond itself through `response$`. Only an explicit `false` turns it off. |
| `redirect` | string | `false` | When set, the adapter redirects to this URL instead of sending the reply. |
| `auth` | object | `false` | Authentication for the route; used only when it has a `strategy` property. Properties: `strategy` (name of the strategy), `pass` (redirect here on success), `fail` (redirect here on failure). Which adapters support it is listed in [Secure routes](../how-to/secure-routes.md). |
| `secure` | object | `false` | The request must already be authenticated. Property `fail` is the redirect for unauthenticated requests. Express adapter only. |
| `middleware` | string, function or array of them | plan entry value | Middleware for this route, run after the plan entry's middleware. Both lists are concatenated, plan entry first. |

## Mapped route

Every mapped route is a plain object with these properties, in this
order. Adapters read them; the log adapter prints them.

| Property | Value |
| -------- | ----- |
| `prefix` | The entry's `prefix`, or `false`. |
| `postfix` | The entry's `postfix`, or `false`. |
| `suffix` | The route's `suffix`, or `false`. |
| `part` | The route name used in the path: the map key, or the `name` override (possibly `''`). |
| `pin` | The entry's `pin`. |
| `alias` | The route's `alias`, or `false`. |
| `methods` | Array of HTTP method names as written in the map value, `['GET']` for non object values. |
| `autoreply` | `true` unless the map value set it to `false`. |
| `redirect` | The redirect URL, or `false`. |
| `auth` | The `auth` object (only when it has a `strategy`), or `false`. |
| `middleware` | Array of middleware (strings and functions), or `false` when none was given. |
| `secure` | The `secure` object, or `false`. |
| `pattern` | The action pattern: the `pin` with `:*` replaced by the map key. |
| `path` | The URL path (below). |

The mapped routes are returned to the caller as the `routes` property of
the reply (`{ ok: true, routes }` from the log adapter, `{ routes }`
from the framework adapters).

## Path generation

With an `alias`:

```
/<alias>
```

Otherwise:

```
/<prefix>/<part>/<postfix>/<suffix>
```

The segments are joined with `path.posix.join`, so leading and trailing
slashes, duplicate slashes and empty segments are normalized: `prefix:
'/api'` and `prefix: 'api'` give the same path, and `name: ''` removes
the segment. A trailing slash is kept when a segment ends with one. The
segments are not percent encoded, so route parameters (`/:id`) and the
framework's own path syntax are passed through unchanged.

## Example

The program [`docs/examples/log-adapter.js`](../examples/log-adapter.js)
maps this plan with the log adapter:

```js
const routes = [
  {
    pin: 'role:admin,cmd:*',
    prefix: '/v1',
    map: {
      home: { GET: true, POST: true, alias: '/home' },
      logout: { GET: true, redirect: '/' },
      profile: { GET: true, autoreply: false },
      login: {
        POST: true,
        auth: { strategy: 'local', pass: '/profile', fail: '/' },
      },
    },
  },
]
```

and prints the mapped routes:

| Methods | Path | Pattern | Notes |
| ------- | ---- | ------- | ----- |
| GET, POST | `/home` | `role:admin,cmd:home` | `alias` replaced the whole path, so `/v1` is absent. |
| GET | `/v1/logout` | `role:admin,cmd:logout` | `redirect: '/'` |
| GET | `/v1/profile` | `role:admin,cmd:profile` | `autoreply: false` |
| POST | `/v1/login` | `role:admin,cmd:login` | `auth: { strategy: 'local', pass: '/profile', fail: '/' }` |

The first mapped route in full:

```json
{
  "prefix": "/v1",
  "postfix": false,
  "suffix": false,
  "part": "home",
  "pin": "role:admin,cmd:*",
  "alias": "/home",
  "methods": ["GET", "POST"],
  "autoreply": true,
  "redirect": false,
  "auth": false,
  "middleware": false,
  "secure": false,
  "pattern": "role:admin,cmd:home",
  "path": "/home"
}
```
