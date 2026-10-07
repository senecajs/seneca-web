'use strict'

// A complete, minimal adapter for Node's own http module. It shows the
// adapter contract: receive the mapped routes, register them with the
// framework (here: a plain lookup table), and turn each request into a
// Seneca message.
// Run with: node docs/examples/write-an-adapter.js

const Http = require('http')
const Seneca = require('seneca')
const SenecaWeb = require('../../') // in your own project: require('seneca-web')

// The adapter. `this` is the Seneca instance; `context` is whatever the
// application passed as the context option, here a lookup table.
function httpAdapter(options, context, auth, routes, done) {
  const seneca = this

  for (const route of routes) {
    for (const method of route.methods) {
      context.table[method + ' ' + route.path] = function handle(req, res, body) {
        const url = new URL(req.url, 'http://localhost')

        // The message: args carries what the action may need, request$
        // and response$ give access to the raw objects (they are removed
        // if the message travels over a transport).
        const msg = {
          args: {
            body: body,
            query: Object.fromEntries(url.searchParams),
            params: {},
            route: route,
          },
          request$: req,
          response$: res,
        }

        seneca.act(route.pattern, msg, function (err, out) {
          res.setHeader('content-type', 'application/json')
          if (err) {
            // Seneca 4 hands back the error the action replied with.
            res.statusCode = 500
            return res.end(JSON.stringify({ error: err.message }))
          }
          if (route.redirect) {
            res.statusCode = 302
            res.setHeader('location', route.redirect)
            return res.end()
          }
          if (route.autoreply) {
            res.end(JSON.stringify(out))
          }
        })
      }
    }
  }

  done(null, { routes: routes })
}

// The context: a table of handlers and a request listener that uses it.
const context = {
  table: {},
  listener: function (req, res) {
    const path = new URL(req.url, 'http://localhost').pathname
    const handle = context.table[req.method + ' ' + path]
    if (!handle) {
      res.statusCode = 404
      return res.end('not found')
    }
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => handle(req, res, body))
  },
}

function demo(options) {
  this.add('role:demo,cmd:hello', function (msg, reply) {
    reply({ hello: msg.args.query.name || 'world' })
  })
  this.add('role:demo,cmd:fail', function (msg, reply) {
    reply(new Error('this action always fails'))
  })
}

const seneca = Seneca({ log: 'warn' })
  .use(demo)
  .use(SenecaWeb, {
    adapter: httpAdapter,
    context: context,
    routes: { pin: 'role:demo,cmd:*', map: { hello: true, fail: true } },
  })

seneca.ready(function () {
  console.log('routes:', Object.keys(context.table))

  const server = Http.createServer(context.listener)
  server.listen(0, async function () {
    const base = 'http://127.0.0.1:' + server.address().port

    let res = await fetch(base + '/hello?name=adapter')
    console.log('GET /hello?name=adapter ->', res.status, await res.json())

    res = await fetch(base + '/fail')
    console.log('GET /fail ->', res.status, await res.json())

    server.close()
    seneca.close(function () {
      console.log('closed')
    })
  })
})
