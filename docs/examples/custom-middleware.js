'use strict'

// Run framework middleware before the Seneca action: named middleware
// defined once in the plugin options, and functions given per route.
// Run with: node docs/examples/custom-middleware.js

const Seneca = require('seneca')
const Express = require('express')
const SenecaWeb = require('../../') // in your own project: require('seneca-web')

function api(options) {
  this.add('role:api,cmd:ping', function (msg, reply) {
    reply({ pong: true, key: msg.request$.apiKey })
  })

  this.add('role:api,cmd:time', function (msg, reply) {
    reply({ time: msg.request$.time })
  })
}

// Named middleware: the keys can be used in route plans.
const middleware = {
  requireKey: function (req, res, next) {
    if ('secret' !== req.headers['x-api-key']) {
      return res.status(401).json({ error: 'missing or wrong x-api-key' })
    }
    req.apiKey = req.headers['x-api-key']
    next()
  },
  // A middleware that always runs can also be added with app.use().
  stamp: function (req, res, next) {
    req.time = 'a fixed time stamp'
    next()
  },
}

const routes = {
  pin: 'role:api,cmd:*',
  // Middleware named at this level applies to every route of the plan.
  middleware: 'stamp',
  map: {
    ping: {
      GET: true,
      // Per route middleware runs after the plan level middleware.
      middleware: ['requireKey'],
    },
    time: {
      GET: true,
      // Functions work too; they do not need to be named.
      middleware: function (req, res, next) {
        res.set('x-example', 'custom-middleware')
        next()
      },
    },
  },
}

const app = Express()

const seneca = Seneca({ log: 'warn' })
  .use(api)
  .use(SenecaWeb, {
    adapter: require('seneca-web-adapter-express'),
    context: app,
    routes: routes,
    middleware: middleware,
  })

seneca.ready(function () {
  const server = app.listen(0, async function () {
    const base = 'http://127.0.0.1:' + server.address().port

    let res = await fetch(base + '/ping')
    console.log('GET /ping (no key) ->', res.status, await res.json())

    res = await fetch(base + '/ping', { headers: { 'x-api-key': 'secret' } })
    console.log('GET /ping (with key) ->', res.status, await res.json())

    res = await fetch(base + '/time')
    console.log('GET /time ->', res.status, await res.json(), 'x-example:', res.headers.get('x-example'))

    server.close()
    seneca.close(function () {
      console.log('closed')
    })
  })
})
