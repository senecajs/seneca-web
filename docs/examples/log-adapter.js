'use strict'

// The log adapter is the default adapter. It prints the mapped routes
// instead of registering them with a web framework, which shows exactly
// how a route plan is turned into routes.
// Run with: node docs/examples/log-adapter.js

const Seneca = require('seneca')
const SenecaWeb = require('../../') // in your own project: require('seneca-web')

const routes = [
  {
    pin: 'role:admin,cmd:*',
    prefix: '/v1',
    map: {
      home: { GET: true, POST: true, alias: '/home' },
      logout: { GET: true, redirect: '/' },
      profile: { GET: true, autoreply: false },
      login: {
        POST: true,
        auth: { strategy: 'local', pass: '/profile', fail: '/' },
      },
    },
  },
]

const seneca = Seneca({ log: 'warn' }).use(SenecaWeb, { routes: routes })

seneca.ready(function () {
  seneca.close()
})
