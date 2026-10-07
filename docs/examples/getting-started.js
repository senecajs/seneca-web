'use strict'

// Getting started with seneca-web: map HTTP routes onto Seneca actions
// with the Express adapter, make two requests, and shut everything down.
// Run with: node docs/examples/getting-started.js

const Seneca = require('seneca')
const Express = require('express')
const SenecaWeb = require('../../') // in your own project: require('@seneca/web')

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
