# seneca-web documentation

The documentation follows the [Diátaxis](https://diataxis.fr/)
structure: four sections with four different jobs. Start with the
tutorial if you are new to seneca-web; use the how-to guides for
specific tasks; look things up in the reference; read the explanations
to understand the design.

## Tutorials

| Tutorial | What you build |
| -------- | -------------- |
| [Getting started](tutorials/getting-started.md) | Two actions exposed over HTTP with the Express adapter: install, route plan, requests, shutdown. |

The programs from the tutorial and the guides are in
[examples](examples/); each runs with `node docs/examples/<name>.js`
and exits on its own.

## How-to guides

| Guide | Covers |
| ----- | ------ |
| [Provide routes](how-to/provide-routes.md) | Pins and maps, methods, prefix, postfix, suffix, name, alias, REST style paths, checking a plan. |
| [Map several plugins under prefixes](how-to/map-several-plugins.md) | One plan entry per plugin, adding routes at runtime, mounting under a router, several servers. |
| [Use custom middleware](how-to/use-custom-middleware.md) | Named and inline middleware, order, framework wide middleware, priors. |
| [Secure routes](how-to/secure-routes.md) | `auth` and `secure`, Passport with Express, Hapi strategies. |
| [Handle errors and status codes](how-to/handle-errors-and-status-codes.md) | Error handlers, status codes, `autoreply: false`, redirects, Seneca 3 and 4 error shapes. |
| [Write an adapter](how-to/write-an-adapter.md) | A minimal adapter for Node's `http` module, step by step. |
| [Migrate from Seneca 3](how-to/migrate-from-seneca-3.md) | What to change in an application moving to Seneca 4. |
| [Create a release](how-to/create-a-release.md) | For maintainers: publishing a new version. |

## Reference

| Reference | Describes |
| --------- | --------- |
| [Options](reference/options.md) | Every plugin option, the adapter options, the one configuration per process rule. |
| [Messages](reference/messages.md) | `role:web,routes:*`, `role:web,set:server`, `init:web`: parameters, replies, errors. |
| [Route mapping](reference/route-mapping.md) | The route plan schema, the mapped route object, path generation. |
| [Request mapping](reference/request-mapping.md) | How requests become messages and replies become responses, per adapter. |
| [Adapter contract](reference/adapter-contract.md) | `adapter.call(seneca, options, context, auth, routes, done)` and what an adapter must do. |
| [Exports](reference/api.md) | `web/mapRoutes`, `web/setServer`, `web/context`. |

## Explanation

| Explanation | Topic |
| ----------- | ----- |
| [How routes become patterns](explanation/how-routes-become-patterns.md) | Pins, the mapped route format, the plugin's own patterns, fatal messages, process wide state. |
| [Why adapters are separate](explanation/why-adapters-are-separate.md) | The plugin and adapter split, the opaque context, portability of actions, error handling. |
| [Seneca 3 and 4](explanation/seneca-3-and-4.md) | What differs for this plugin between the two Seneca versions. |

## Feature index

Every option, message, route property, export and error of the plugin,
with the page that documents it. The plugin defines no error codes
(it has no `errors` map) and no command line flags.

| Feature | Kind | Documented in |
| ------- | ---- | ------------- |
| `adapter` | plugin option | [Options](reference/options.md) |
| `context` | plugin option | [Options](reference/options.md) |
| `auth` | plugin option | [Options](reference/options.md), [Secure routes](how-to/secure-routes.md) |
| `routes` | plugin option | [Options](reference/options.md), [Route mapping](reference/route-mapping.md) |
| `options` | plugin option | [Options](reference/options.md) |
| `options.parseBody` | adapter option | [Options](reference/options.md#adapter-options) |
| `options.includeRequest`, `options.includeResponse` | adapter option (express) | [Options](reference/options.md#adapter-options) |
| `options.middleware` | adapter option | [Options](reference/options.md#adapter-options), [Use custom middleware](how-to/use-custom-middleware.md) |
| `options.sink` | adapter option (log adapter) | [Options](reference/options.md#adapter-options), [Adapter contract](reference/adapter-contract.md#the-log-adapter) |
| `middleware` | plugin option | [Options](reference/options.md), [Use custom middleware](how-to/use-custom-middleware.md) |
| `role:web,routes:*` | message | [Messages](reference/messages.md#rolewebroutes) |
| `role:web,set:server` | message | [Messages](reference/messages.md#rolewebsetserver) |
| `role:web,set:server,routes:*` | message (added in 2.3.0) | [Messages](reference/messages.md#rolewebsetserver) |
| `init:web` | message (plugin initialization) | [Messages](reference/messages.md#initweb) |
| `pin` | route plan entry | [Route mapping](reference/route-mapping.md#plan-entry) |
| `map` | route plan entry | [Route mapping](reference/route-mapping.md#plan-entry) |
| `prefix`, `postfix` | route plan entry | [Route mapping](reference/route-mapping.md#plan-entry) |
| `middleware` (plan entry and map value) | route plan | [Route mapping](reference/route-mapping.md), [Use custom middleware](how-to/use-custom-middleware.md) |
| `GET`, `POST`, `PUT`, `HEAD`, `DELETE`, `OPTIONS`, `PATCH` | map value | [Route mapping](reference/route-mapping.md#map-values) |
| `alias` | map value | [Route mapping](reference/route-mapping.md#map-values) |
| `name` | map value | [Route mapping](reference/route-mapping.md#map-values) |
| `suffix` | map value | [Route mapping](reference/route-mapping.md#map-values) |
| `autoreply` | map value | [Route mapping](reference/route-mapping.md#map-values), [Handle errors and status codes](how-to/handle-errors-and-status-codes.md) |
| `redirect` | map value | [Route mapping](reference/route-mapping.md#map-values) |
| `auth` (`strategy`, `pass`, `fail`) | map value | [Route mapping](reference/route-mapping.md#map-values), [Secure routes](how-to/secure-routes.md) |
| `secure` (`fail`) | map value | [Route mapping](reference/route-mapping.md#map-values), [Secure routes](how-to/secure-routes.md) |
| mapped route (`pattern`, `path`, `part`, `methods`, ...) | adapter input | [Route mapping](reference/route-mapping.md#mapped-route) |
| path generation | rule | [Route mapping](reference/route-mapping.md#path-generation) |
| `args` (`body`, `query`, `params`, `route`, `user`, ...) | message property | [Request mapping](reference/request-mapping.md) |
| `request$`, `response$` | message property | [Request mapping](reference/request-mapping.md) |
| `adapter.call(seneca, options, context, auth, routes, done)` | adapter contract | [Adapter contract](reference/adapter-contract.md) |
| log adapter (`lib/adapters/log.js`) | default adapter | [Adapter contract](reference/adapter-contract.md#the-log-adapter) |
| `web/mapRoutes` | export | [Exports](reference/api.md) |
| `web/setServer` | export | [Exports](reference/api.md) |
| `web/context` | export | [Exports](reference/api.md) |
| `Provide a function as adapter` | error | [Messages](reference/messages.md#rolewebsetserver) |
| `no context provided` | error (published adapters) | [Messages](reference/messages.md#rolewebroutes) |
| `expected valid middleware, got <value>` | error (express, connect adapters) | [Messages](reference/messages.md#rolewebroutes) |
| `peerDependencies.seneca: >=3 \|\| >=4.0.0-rc5` | package | [Migrate from Seneca 3](how-to/migrate-from-seneca-3.md) |
| one configuration per process | limit | [Options](reference/options.md#one-configuration-per-process) |

## Other documents

* [Change log](../CHANGES.md)
* [Code of conduct](../CODE_OF_CONDUCT.md)
* [License](../LICENSE)
* [Workflow patches](../.patches/README.md)
