# Seneca 3 and 4

`@seneca/web` 3.0.0 runs on Seneca 4 only. Seneca 3 users stay on
`seneca-web` 2.2.x. This page lists what differs between the two Seneca
versions for this plugin, for applications that move from Seneca 3.
The Seneca 3 facts were verified against Seneca 3.38.0, the Seneca 4
facts against 4.0.0.

## Errors are not wrapped on Seneca 4

The visible difference. On Seneca 3 (default `legacy.error: true`) the
error that reaches the adapter's `act` callback, and therefore the
framework's error handler, is a wrapper: `err.message` is `seneca:
Action cmd:item,role:shop failed: item 2 not found.`, the action's
error is `err.orig`, and `err.details.message` repeats its message. On
Seneca 4 the callback receives the action's error unchanged, with
Seneca's description attached as `err.meta$`. Adapter tests and error
handlers that read `err.orig` must read `err` instead.

## What did not change

* The plugin definition (`function web(options)`), the `init:web`
  initialization hook, `exportmap`, `seneca.delegate`, `seneca.root`
  and `seneca.export` work the same on both. `seneca.util.deepextend`
  still works on Seneca 4 but is deprecated
  (`SENECA_DEP_UTIL_DEEPEXTEND`); 3.0.0 uses `seneca.util.deep`
  instead. The plugin needs none of the removed Seneca 3 APIs.
* Fatal semantics: both versions mark messages sent through a plugin
  delegate as fatal, so `seneca-web` 2.2.x has the problem on Seneca 3
  too. 3.0.0 fixes it by calling adapters with a delegate of the root
  instance.
* Pattern matching: `routes` sorts before `set` in `role:web,set:server`
  messages on both versions; the `role:web,set:server,routes:*` pattern
  of 3.0.0 fixes it.
* Plugin option handling: both versions walk the options given to
  `use()`, so a context with circular references hangs plugin loading
  on 3.38 and overflows the stack on Seneca 4. Pass such objects with
  `set:server`.
* Request mapping: the adapters use no Seneca API beyond `act`. Use
  the Seneca 4 releases of the adapters, such as
  `@seneca/web-adapter-express` 2.

## Differences that may affect an application

| Topic | Seneca 3 | Seneca 4 |
| ----- | -------- | -------- |
| Node.js | 8 and later (3.38 is tested on recent versions too) | 24 and later |
| Top level plugin options `Seneca({ web: {...} })` | merged into the plugin options | rejected: `Seneca()` throws a validation error (`the property "web" is not allowed`); use `options.plugin.web` or `use()` |
| Network transport for remote actions | `web`, `http` and `tcp` built in | `@seneca/transport` must be loaded |
| Promises | `seneca-promisify` | built in: `await seneca.ready()`, `seneca.post`, `await seneca.close()` |
| Close hook | `role:seneca,cmd:close` | `this.destroy(fn)` in a plugin (this plugin has no close hook; servers are closed by the application) |
| `legacy.*` options | many flags | `meta` and `builtin_actions` only; `legacy.error` has no effect, and the other flags are ignored, each with a deprecation warning |

## Tests

The repository's `devDependencies` and the peer range are `seneca`
`^4.0.0`, and the tests run on Seneca 4 only. They match `err.message`
with regular expressions, which hold for the action's own error.
