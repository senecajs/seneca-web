# Migrate from Seneca 3

How to move an application that uses seneca-web from Seneca 3 to
Seneca 4. `seneca-web` 2.2.x runs on Seneca 3, and `@seneca/web` 3.0.0
runs on Seneca 4 only, so the plugin changes its name with the move.
The Express and Koa adapters have new names too. Seneca's own guide is
[Migrate from Seneca 3](https://github.com/senecajs/seneca/blob/master/docs/how-to/migrate-from-seneca-3.md)
in the Seneca repository.

## 1. Update Node.js, Seneca and the packages

Seneca 4 needs Node.js 24 or later. Replace the packages:

```sh
npm uninstall seneca-web seneca-web-adapter-express
npm install seneca@^4 @seneca/web @seneca/web-adapter-express
```

Then require the new names:

```js
// before
seneca.use(require('seneca-web'), { adapter: require('seneca-web-adapter-express'), context: app })

// after
seneca.use(require('@seneca/web'), { adapter: require('@seneca/web-adapter-express'), context: app })
```

`@seneca/web` 3.0.0 declares `peerDependencies: { seneca: "^4.0.0" }`.
It no longer percent encodes route paths (a space stays a space); see
[CHANGES.md](../../CHANGES.md).

## 2. Update error handling

On Seneca 3 an action error reached the adapter wrapped: the message was
`seneca: Action <pattern> failed: <message>.`, the action's error was
`err.orig` and its message was also in `err.details.message`. On Seneca
4 the adapter receives the action's error itself and `err.orig` does
not exist.

```js
// before
res.status(400).send({ message: err.orig.message })

// after
res.status(400).send({ message: err.message })
```

Check Express error handlers, Koa `try/catch` blocks and tests that
assert on `seneca: Action ... failed`.

## 3. Plugin options

Seneca 3 also merged a top level `web` property of the Seneca options
into the plugin options (`Seneca({ web: { ... } })`). Seneca 4 rejects
an unknown top level option: `Seneca()` throws a validation error
(`the property "web" is not allowed`). It reads plugin options from
`seneca.use(SenecaWeb, options)` and from `options.plugin.web`
(`Seneca({ plugin: { web: { ... } } })`). Move any top level `web`
options.

## 4. Remote actions need a transport

Seneca 4 has no built in network transport. If web routes forward
messages to actions in other services with `seneca.client()`, install
`@seneca/transport` and load it before `client`:

```sh
npm install @seneca/transport
```

```js
seneca.use('@seneca/transport').client({ port: 4041, pin: 'role:todo,cmd:*' })
```

Messages for remote actions carry `args` but not `request$` or
`response$`, on both versions.

## 5. Promises

`seneca-promisify` is not needed on Seneca 4: `seneca.message`,
`seneca.post`, `await seneca.ready()` and `await seneca.close()` are
built in. Remove the `seneca-promisify` package and its `use` call.

## 6. Run the tests

Start the application with `--seneca.test` once and look for
`DEPRECATED` and `UNKNOWN` log entries, or run it with
`node --trace-deprecation` and look for `SENECA_DEP_*` warnings. Then
run your tests: plugin failures that Seneca 3 tolerated are fatal in
Seneca 4.

## What did not change

`seneca.use(SenecaWeb, { adapter, context, auth, routes, options,
middleware })`, the `role:web` messages, the exports, the route plan
schema and the request mapping are the same on both versions. Context
objects with circular references (such as a Hapi server) have to be
passed with `role:web,set:server` on both Seneca 3.38 and Seneca 4,
see [Options](../reference/options.md).
