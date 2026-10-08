# Seneca 3 and 4

seneca-web 2.3.0 runs on Seneca 3 and on Seneca 4 (from 4.0.0-rc5).
This page lists what differs between the two for this plugin, with the
facts verified against Seneca 3.38.0, 4.0.0-rc5 and the unreleased
4.0.0.

## Errors are not wrapped on Seneca 4

The visible difference. On Seneca 3 (default `legacy.error: true`) the
error that reaches the adapter's `act` callback, and therefore the
framework's error handler, is a wrapper: `err.message` is `seneca:
Action cmd:item,role:shop failed: item 2 not found.`, the action's
error is `err.orig`, and `err.details.message` repeats its message. On
Seneca 4 the callback receives the action's error unchanged, with
Seneca's description attached as `err.meta$`. Adapter tests and error
handlers that read `err.orig` must read `(err.orig || err)`.

## What is the same

* The plugin definition (`function web(options)`), the `init:web`
  initialization hook, `exportmap`, `seneca.util.deepextend`,
  `seneca.delegate`, `seneca.root` and `seneca.export` all work on
  both. The plugin needs none of the removed Seneca 3 APIs.
* Fatal semantics: both versions mark messages sent through a plugin
  delegate as fatal. The 2.3.0 fix (adapters get a delegate of the root
  instance) was needed, and behaves the same, on both.
* Pattern matching: `routes` sorting before `set` in
  `role:web,set:server` messages happens on both; the
  `role:web,set:server,routes:*` pattern fixes it on both.
* Plugin option handling: both walk the options given to `use()`, so a
  context with circular references hangs plugin loading on 3.38 and
  hangs (rc5) or overflows the stack (4.0.0) on Seneca 4. Pass such
  objects with `set:server`.
* Request mapping and the adapters: the published adapters do not use
  any Seneca API beyond `act`, so they run unchanged.

## Differences that may affect an application

| Topic | Seneca 3 | Seneca 4 |
| ----- | -------- | -------- |
| Node.js | 8 and later (3.38 is tested on recent versions too) | 22 and later |
| Top level plugin options `Seneca({ web: {...} })` | merged into the plugin options | not merged; use `options.plugin.web` or `use()` |
| Network transport for remote actions | `web`, `http` and `tcp` built in | `seneca-transport` must be loaded |
| Promises | `seneca-promisify` | built in; `await seneca.ready()` hangs on an idle rc5 instance, use the callback form |
| Close hook pattern | `role:seneca,cmd:close` | `sys:seneca,cmd:close` (the plugin has no close hook; servers are closed by the application) |
| `legacy.*` options | many flags | only `error`, `meta`, `builtin_actions` |

## Testing against both

The repository's `devDependencies` pin `seneca@^4.0.0-rc5`; the peer
range `>=3 || >=4.0.0-rc5` keeps Seneca 3 installable. To run the test
suite against Seneca 3: `npm install --no-save seneca@3 && npm test`
(then `npm install` to restore the lock file). The tests avoid asserting
on wrapped messages: they match `err.message` with a regular expression
that holds for both shapes.
