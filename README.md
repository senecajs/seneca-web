![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js][] plugin

# @seneca/web

HTTP route mapping for [Seneca](https://senecajs.org) microservices: a
route plan turns URLs into Seneca messages, and an adapter registers the
routes with the web framework of your choice (Express, Hapi, Koa,
Connect, or your own). Works with Seneca 3 and Seneca 4 (prerelease
`4.0.0-rc5` and later) on Node.js 18 and later; tested on Node.js 24
and 22.

[![npm version][npm-badge]][npm-url]
[![build][build-badge]][build-url]

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install seneca-web seneca-web-adapter-express express
```

Pick the adapter for your framework: [seneca-web-adapter-express][],
[seneca-web-adapter-hapi][], [seneca-web-adapter-koa2][],
[seneca-web-adapter-connect][]. Without an adapter the plugin prints
the mapped routes, which is useful to check a route plan.

## Quick Example

```js
const Seneca = require('seneca')
const Express = require('express')
const SenecaWeb = require('seneca-web')

const app = Express()

const seneca = Seneca()
  .add('role:greeting,cmd:hello', function (msg, reply) {
    reply({ hello: msg.args.query.name || 'world' })
  })
  .use(SenecaWeb, {
    adapter: require('seneca-web-adapter-express'),
    context: app,
    routes: {
      prefix: '/api',
      pin: 'role:greeting,cmd:*',
      map: {
        hello: true, // GET /api/hello -> role:greeting,cmd:hello
      },
    },
  })

seneca.ready(function () {
  app.listen(3000) // GET http://localhost:3000/api/hello?name=Seneca -> {"hello":"Seneca"}
})
```

A route plan entry has a `pin` (the action pattern, with `:*` for the
part that varies), an optional `prefix`, and a `map` whose keys fill in
the `:*` and name the URL. Map values choose the HTTP methods and
options such as `alias`, `suffix`, `autoreply`, `redirect`, `auth`,
`secure` and `middleware`:

```js
const routes = [{
  pin: 'role:admin,cmd:*',
  prefix: '/v1',
  map: {
    home: { GET: true, POST: true, alias: '/home' }, // GET, POST /home
    logout: { GET: true, redirect: '/' },            // GET /v1/logout, then redirect
    profile: { GET: true, autoreply: false },        // the action writes the response
    login: { POST: true, auth: { strategy: 'local', pass: '/profile', fail: '/' } },
  },
}]
```

## More Examples

* [Getting started](docs/tutorials/getting-started.md): a complete program
  with the Express adapter, run and explained.
* How-to guides: [provide routes](docs/how-to/provide-routes.md),
  [map several plugins under prefixes](docs/how-to/map-several-plugins.md),
  [use custom middleware](docs/how-to/use-custom-middleware.md),
  [secure routes](docs/how-to/secure-routes.md),
  [handle errors and status codes](docs/how-to/handle-errors-and-status-codes.md),
  [write an adapter](docs/how-to/write-an-adapter.md),
  [migrate from Seneca 3](docs/how-to/migrate-from-seneca-3.md).
* Runnable programs for every guide are in [docs/examples](docs/examples/).

The full documentation index is [docs/README.md](docs/README.md).

## Motivation

Seneca actions are reached by message patterns, not URLs. This plugin
lets an existing set of actions be exposed over HTTP by describing the
mapping once, without writing a controller per route, and keeps the
web framework out of the actions: the request data arrives as `msg.args`
and the reply becomes the response. See
[How routes become patterns](docs/explanation/how-routes-become-patterns.md)
and [Why adapters are separate](docs/explanation/why-adapters-are-separate.md).

## Support

* Open a [GitHub issue][github issue] for bugs and questions about this plugin.
* The [Seneca documentation](https://senecajs.org) covers Seneca itself.
* Commercial support is available from [Voxgig](https://www.voxgig.com).

## API

Plugin options (`seneca.use(SenecaWeb, options)`), see [Options](docs/reference/options.md):

| Option | Purpose |
| ------ | ------- |
| `adapter` | Adapter function; default: the log adapter, which prints the routes. |
| `context` | The framework object to register routes on (Express app, Hapi server, Koa router). |
| `auth` | Authentication provider handed to the adapter (Passport with Express). |
| `routes` | Route plan mapped at startup. |
| `options` | Adapter options, for example `parseBody`. |
| `middleware` | Named middleware functions for route plans. |

Messages, see [Messages](docs/reference/messages.md):

| Pattern | Purpose |
| ------- | ------- |
| `role:web,routes:*` | Map a route plan: `seneca.act('role:web', { routes })`. |
| `role:web,set:server` | Change the adapter, context, auth or options; optionally map routes. |

Exports (`seneca.export('web/...')`), see [Exports](docs/reference/api.md):
`web/mapRoutes`, `web/setServer`, `web/context`.

Also in the reference: the [route mapping schema](docs/reference/route-mapping.md),
the [request to message mapping](docs/reference/request-mapping.md) and
the [adapter contract](docs/reference/adapter-contract.md).

## Contributing

The [Senecajs org][] encourages open participation. If you feel you can
help in any way, be it with documentation, examples, extra testing, or
new features please get in touch.

To run the tests (ESLint, then Mocha) on Node.js 24 or 22:

```sh
npm install
npm test
```

The tests run against the Seneca version in `devDependencies`
(`^4.0.0-rc5`). To test against another Seneca, install it without
saving: `npm install --no-save seneca@3` and `npm test`. `npm run
coverage` writes a coverage report to `coverage/`. The examples in
`docs/examples` run with `node docs/examples/<name>.js` and exit on
their own.

The GitHub Actions workflow for continuous integration is provided as a
patch in [`.patches/`](.patches/README.md), because adding workflow
files needs a GitHub token with the `workflow` scope; apply it with
`git am .patches/*.patch`.

## Background

seneca-web started in 2014 as part of the Seneca project, was rebuilt
in 2016 (version 1.0.0) around the route mapper and separate adapter
packages, and was sponsored originally by [nearForm](http://nearform.com).
Version 2.3.0 adds Seneca 4 support. The change log is in
[CHANGES.md](CHANGES.md).

| seneca-web | Seneca | Node.js |
| ---------- | ------ | ------- |
| 2.3.x | 3.x and 4.x (from 4.0.0-rc5) | 18 and later; tested on 24 and 22 |
| 2.2.x | 3.x | 8 and later |

Licensed under [MIT][].

[npm-badge]: https://badge.fury.io/js/seneca-web.svg
[npm-url]: https://badge.fury.io/js/seneca-web
[build-badge]: https://github.com/senecajs/seneca-web/actions/workflows/build.yml/badge.svg
[build-url]: https://github.com/senecajs/seneca-web/actions/workflows/build.yml
[MIT]: ./LICENSE
[Senecajs org]: https://github.com/senecajs/
[Seneca.js]: https://www.npmjs.com/package/seneca
[github issue]: https://github.com/senecajs/seneca-web/issues
[seneca-web-adapter-express]: https://github.com/senecajs/seneca-web-adapter-express
[seneca-web-adapter-hapi]: https://github.com/senecajs/seneca-web-adapter-hapi
[seneca-web-adapter-koa2]: https://github.com/senecajs/seneca-web-adapter-koa2
[seneca-web-adapter-connect]: https://github.com/senecajs/seneca-web-adapter-connect
