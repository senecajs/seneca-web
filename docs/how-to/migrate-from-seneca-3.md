# Migrate from Seneca 3

How to move an application that uses seneca-web from Seneca 3 to
Seneca 4. seneca-web 2.3.0 supports both, so the plugin and the
published adapters stay the same; the changes are in the application.
Seneca's own guide is
[Migrate from Seneca 3](https://github.com/senecajs/seneca/blob/master/docs/how-to/migrate-from-seneca-3.md)
in the Seneca repository.

## 1. Update Node.js and Seneca

Seneca 4 needs Node.js 22 or later. Install the Seneca 4 prerelease
until 4.0.0 is published:

```sh
npm install seneca@^4.0.0-rc5 seneca-web@^2.3.0
```

seneca-web 2.3.0 declares `peerDependencies: { seneca: ">=3 || >=4.0.0-rc5" }`;
a plain `>=3` range would exclude the prerelease.

## 2. Update error handling

On Seneca 3 an action error reached the adapter wrapped: the message was
`seneca: Action <pattern> failed: <message>.`, the action's error was
`err.orig` and its message was also in `err.details.message`. On Seneca
4 the adapter receives the action's error itself and `err.orig` does
not exist.

```js
// before
res.status(400).send({ message: err.orig.message })

// after (works on both)
res.status(400).send({ message: (err.orig || err).message })
```

Check Express error handlers, Koa `try/catch` blocks and tests that
assert on `seneca: Action ... failed`.

## 3. Plugin options

Seneca 3 also merged a top level `web` property of the Seneca options
into the plugin options (`Seneca({ web: { ... } })`). Seneca 4 reads
plugin options only from `seneca.use(SenecaWeb, options)` and from
`options.plugin.web`. Move any top level `web` options.

## 4. Remote actions need a transport

Seneca 4 has no built in network transport. If web routes forward
messages to actions in other services with `seneca.client()`, install
`seneca-transport` and load it before `client`:

```sh
npm install seneca-transport
```

```js
seneca.use('seneca-transport').client({ port: 4041, pin: 'role:todo,cmd:*' })
```

Messages for remote actions carry `args` but not `request$` or
`response$`, on both versions.

## 5. Promises

`seneca-promisify` is not needed on Seneca 4: `seneca.message`,
`seneca.post`, `await seneca.ready()` and `await seneca.close()` are
built in. On 4.0.0-rc5, `await seneca.ready()` hangs when the instance
has nothing left to load; use the callback form `seneca.ready(fn)` (as
the examples do) until 4.0.0.

## 6. Run the tests

Start the application with `--seneca.test` once and look for
`DEPRECATED` and `UNKNOWN` log entries. Then run your tests: plugin
failures that Seneca 3 tolerated are fatal in Seneca 4.

## What did not change

`seneca.use(SenecaWeb, { adapter, context, auth, routes, options,
middleware })`, the `role:web` messages, the exports, the route plan
schema and the request mapping are the same on both versions. The
adapters do not depend on the Seneca version. Context objects with
circular references (such as a Hapi server) have to be passed with
`role:web,set:server` on both Seneca 3.38 and Seneca 4, see
[Options](../reference/options.md).
