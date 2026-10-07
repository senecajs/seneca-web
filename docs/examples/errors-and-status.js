'use strict'

// Turn action errors into HTTP status codes, write a response yourself
// with autoreply:false, and redirect.
// Run with: node docs/examples/errors-and-status.js

const Seneca = require('seneca')
const Express = require('express')
const SenecaWeb = require('../../') // in your own project: require('seneca-web')

function shop(options) {
  this.add('role:shop,cmd:item', function (msg, reply) {
    const id = msg.args.params.id
    if ('1' !== id) {
      const err = new Error('item ' + id + ' not found')
      err.code = 'not_found'
      return reply(err)
    }
    reply({ id: 1, name: 'kiwi' })
  })

  // autoreply:false routes write the response themselves through response$.
  this.add('role:shop,cmd:order', function (msg, reply) {
    msg.response$.status(201).json({ ordered: msg.args.body.item })
    reply()
  })

  this.add('role:shop,cmd:old', function (msg, reply) {
    reply({ never: 'sent, the route redirects' })
  })
}

const routes = {
  prefix: '/shop',
  pin: 'role:shop,cmd:*',
  map: {
    item: { GET: true, suffix: '/:id' },
    order: { POST: true, autoreply: false },
    old: { GET: true, redirect: '/shop/item/1' },
  },
}

const app = Express()
app.use(Express.json())

const seneca = Seneca({ log: 'warn' })
  .use(shop)
  .use(SenecaWeb, {
    adapter: require('seneca-web-adapter-express'),
    context: app,
    routes: routes,
    options: { parseBody: false },
  })

seneca.ready(function () {
  // The Express adapter passes action errors to next(err), so an Express
  // error handler chooses the status code. Express only routes errors to
  // handlers added after the failing route, and the plugin adds its
  // routes while it loads, so the handler is added here, after ready.
  // On Seneca 4 the error is the one the action replied with; on
  // Seneca 3 it is wrapped and the original is err.orig.
  app.use(function (err, req, res, next) {
    const orig = err.orig || err
    const status = 'not_found' === orig.code ? 404 : 500
    res.status(status).json({ error: orig.message, code: orig.code })
  })

  const server = app.listen(0, async function () {
    const base = 'http://127.0.0.1:' + server.address().port

    let res = await fetch(base + '/shop/item/1')
    console.log('GET /shop/item/1 ->', res.status, await res.json())

    res = await fetch(base + '/shop/item/2')
    console.log('GET /shop/item/2 ->', res.status, await res.json())

    res = await fetch(base + '/shop/order', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ item: 'kiwi' }),
    })
    console.log('POST /shop/order ->', res.status, await res.json())

    res = await fetch(base + '/shop/old', { redirect: 'manual' })
    console.log('GET /shop/old ->', res.status, 'location:', res.headers.get('location'))

    server.close()
    seneca.close(function () {
      console.log('closed')
    })
  })
})
