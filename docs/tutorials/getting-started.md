# Getting started

In this tutorial you expose two Seneca actions as HTTP endpoints with
seneca-web and the Express adapter, make requests to them, and shut
everything down cleanly. It takes about fifteen minutes. The finished
program is [`docs/examples/getting-started.js`](../examples/getting-started.js).

## 1. Install

seneca-web needs Node.js 18 or later (24 is recommended) and Seneca 3 or
4. In a new directory:

```sh
npm init -y
npm install seneca@^4.0.0-rc5 @seneca/web seneca-web-adapter-express express
```

Until Seneca 4.0.0 is published, `seneca@^4.0.0-rc5` installs the
prerelease; `npm install seneca` installs Seneca 3, which works too.

## 2. Write the program

Create `getting-started.js`:

```js
'use strict'

const Seneca = require('seneca')
const Express = require('express')
const SenecaWeb = require('@seneca/web')

// A plugin with two actions. Web requests arrive as messages whose
// `args` property carries the body, query and route parameters.
function greeting(options) {
  this.add('role:greeting,cmd:hello', function (msg, reply) {
    const name = msg.args.query.name || 'world'
    reply({ hello: name })
  })

  this.add('role:greeting,cmd:echo', function (msg, reply) {
    reply({
      method: msg.request$.method,
      id: msg.args.params.id,
      body: msg.args.body,
    })
  })
}

// The route plan: which URLs map to which messages.
const routes = [
  {
    prefix: '/api',
    pin: 'role:greeting,cmd:*',
    map: {
      hello: true, // GET /api/hello           -> role:greeting,cmd:hello
      echo: { POST: true, suffix: '/:id' }, // POST /api/echo/:id -> role:greeting,cmd:echo
    },
  },
]

const app = Express()
app.use(Express.json())

const seneca = Seneca({ log: 'warn' })
  .use(greeting)
  .use(SenecaWeb, {
    adapter: require('seneca-web-adapter-express'),
    context: app,
    routes: routes,
    // Express parses the body above, so the adapter must not read it again.
    options: { parseBody: false },
  })

seneca.ready(function () {
  // The routes are registered on `app` once the plugin is ready.
  const server = app.listen(0, async function () {
    const base = 'http://127.0.0.1:' + server.address().port

    let res = await fetch(base + '/api/hello?name=Seneca')
    console.log('GET /api/hello?name=Seneca ->', res.status, await res.json())

    res = await fetch(base + '/api/echo/42', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note: 'hi' }),
    })
    console.log('POST /api/echo/42 ->', res.status, await res.json())

    server.close()
    seneca.close(function () {
      console.log('closed')
    })
  })
})
```

## 3. Run it

```sh
node getting-started.js
```

Output (Node.js 24, Seneca 4.0.0-rc5, seneca-web 2.3.0):

```
GET /api/hello?name=Seneca -> 200 { hello: 'Seneca' }
POST /api/echo/42 -> 200 { method: 'POST', id: '42', body: { note: 'hi' } }
closed
```

The program exits by itself: the HTTP server and the Seneca instance are
both closed.

## 4. What happened

**The route plan became two routes.** The plan has one entry. Its `pin`,
`role:greeting,cmd:*`, names the actions to expose; the `:*` is the part
that varies. Each key of `map` fills it in: `hello` gives the pattern
`role:greeting,cmd:hello`, `echo` gives `role:greeting,cmd:echo`. The
key is also the URL: with the `prefix`, `hello` is served at
`/api/hello`. A value of `true` means a `GET` route; the object for
`echo` asks for `POST` and adds the `suffix` `/:id`, an Express route
parameter. The result is:

| Method | Path | Pattern |
| ------ | ---- | ------- |
| GET | `/api/hello` | `role:greeting,cmd:hello` |
| POST | `/api/echo/:id` | `role:greeting,cmd:echo` |

You can see this table for any plan by running the plan through the
default adapter, which prints it: see
[`docs/examples/log-adapter.js`](../examples/log-adapter.js).

**The adapter registered them on the Express application.** When the
plugin initializes, it hands the mapped routes to the adapter together
with the `context` (the Express application). The adapter calls
`app.get('/api/hello', handler)` and `app.post('/api/echo/:id', handler)`.
This happens while Seneca loads the plugin, which is why the server is
started inside `seneca.ready`.

**Each request became a message.** For `GET /api/hello?name=Seneca`,
the adapter sent the message `role:greeting,cmd:hello` with `args.query
= { name: 'Seneca' }`. The action replied `{ hello: 'Seneca' }`, and
because the route has `autoreply: true` (the default) the adapter sent
the reply as the JSON response. For the `POST`, `args.params.id` was
`'42'` and `args.body` was the parsed JSON object, because Express
parsed it (`express.json()`) and the adapter was told not to read the
body itself (`parseBody: false`). The raw Express request was available
as `msg.request$`, which the action used to report the method.

**Shutdown.** `server.close()` stops accepting connections and
`seneca.close()` shuts Seneca down. With both closed the process has
nothing left to do and exits.

## 5. Try a change

* Add `world: true` to the `map` and a `role:greeting,cmd:world` action.
  Request `/api/world`.
* Remove `app.use(Express.json())` and `options: { parseBody: false }`:
  `args.body` is now the raw body string `'{"note":"hi"}'`, and the
  action has to parse it.
* Make an action reply with an error: `reply(new Error('no'))`. Express
  answers with status 500 and its default error page. The guide
  [Handle errors and status codes](../how-to/handle-errors-and-status-codes.md)
  shows how to choose the status code.

## Where next

* [Provide routes](../how-to/provide-routes.md) covers every route plan
  property, including REST style paths.
* [Map several plugins under prefixes](../how-to/map-several-plugins.md)
  grows the example to several plugins and adds routes at runtime.
* [Secure routes](../how-to/secure-routes.md) and
  [Use custom middleware](../how-to/use-custom-middleware.md) run
  framework code before the action.
* The [reference](../README.md#reference) specifies the options, the
  messages and the request mapping; the [explanation](../README.md#explanation)
  pages describe the design.
