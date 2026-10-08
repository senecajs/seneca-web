'use strict'

// Protect routes with `auth` (an authentication strategy runs before the
// action) and `secure` (the request must already carry a user). The
// Express adapter calls auth.authenticate(strategy, options), which is
// the Passport API; this example uses a tiny provider with the same
// shape so that it runs without a session store.
// Run with: node docs/examples/secure-routes.js

const Seneca = require('seneca')
const Express = require('express')
const SenecaWeb = require('../../') // in your own project: require('@seneca/web')

// Something that looks like Passport: authenticate(strategy, options)
// returns middleware. Here the "credential" is the x-user header.
const auth = {
  authenticate: function (strategy, options) {
    return function (req, res, next) {
      const user = req.headers['x-user']
      if (!user) return res.redirect(options.failureRedirect)
      req.user = { name: user, strategy: strategy }
      if (options.successRedirect) return res.redirect(options.successRedirect)
      next()
    }
  },
}

function site(options) {
  this.add('role:site,cmd:home', function (msg, reply) {
    reply({ page: 'home', user: msg.args.user })
  })

  this.add('role:site,cmd:profile', function (msg, reply) {
    reply({ page: 'profile', user: msg.args.user })
  })

  this.add('role:site,cmd:login', function (msg, reply) {
    // Not reached when the strategy redirects on success.
    reply({ page: 'login', user: msg.args.user })
  })
}

const routes = {
  pin: 'role:site,cmd:*',
  map: {
    home: { GET: true, alias: '/' },
    // secure: the request must have req.user, otherwise redirect to fail.
    profile: { GET: true, secure: { fail: '/' } },
    // auth: run the named strategy first; redirect on pass or fail.
    login: { POST: true, auth: { strategy: 'header', pass: '/profile', fail: '/' } },
  },
}

const app = Express()

// Stand in for a session: a request with an x-user header is logged in.
app.use(function (req, res, next) {
  if (req.headers['x-user']) req.user = { name: req.headers['x-user'] }
  next()
})

const seneca = Seneca({ log: 'warn' })
  .use(site)
  .use(SenecaWeb, {
    adapter: require('seneca-web-adapter-express'),
    context: app,
    routes: routes,
    auth: auth,
  })

seneca.ready(function () {
  const server = app.listen(0, async function () {
    const base = 'http://127.0.0.1:' + server.address().port

    async function show(method, path, headers) {
      const res = await fetch(base + path, { method, headers, redirect: 'manual' })
      const body = 200 === res.status ? await res.json() : 'location: ' + res.headers.get('location')
      console.log(method, path, headers ? JSON.stringify(headers) : '', '->', res.status, body)
    }

    await show('GET', '/')
    await show('GET', '/profile')
    await show('GET', '/profile', { 'x-user': 'jack' })
    await show('POST', '/login')
    await show('POST', '/login', { 'x-user': 'jill' })

    server.close()
    seneca.close(function () {
      console.log('closed')
    })
  })
})
