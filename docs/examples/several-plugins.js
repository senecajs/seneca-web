'use strict'

// Map the actions of several plugins under their own URL prefixes, in a
// REST style, and add more routes while the server is running.
// Run with: node docs/examples/several-plugins.js

const Seneca = require('seneca')
const Express = require('express')
const SenecaWeb = require('../../') // in your own project: require('seneca-web')

function todo(options) {
  const items = { 1: { id: 1, text: 'write docs' } }

  this.add('role:todo,cmd:list', function (msg, reply) {
    reply(Object.values(items))
  })

  this.add('role:todo,cmd:load', function (msg, reply) {
    const item = items[msg.args.params.id]
    reply(item ? item : new Error('no todo ' + msg.args.params.id))
  })

  this.add('role:todo,cmd:create', function (msg, reply) {
    const id = Object.keys(items).length + 1
    items[id] = { id: id, text: msg.args.body.text }
    reply(items[id])
  })
}

function admin(options) {
  this.add('role:admin,cmd:status', function (msg, reply) {
    reply({ ok: true, uptime: Math.floor(process.uptime()) })
  })
}

// One route plan entry per plugin. An empty `name` removes the map key
// from the path, so that the HTTP method alone tells the actions apart.
const routes = [
  {
    prefix: '/todo',
    pin: 'role:todo,cmd:*',
    map: {
      list: { GET: true, name: '' }, //   GET  /todo
      load: { GET: true, name: '', suffix: '/:id' }, // GET /todo/:id
      create: { POST: true, name: '' }, // POST /todo
    },
  },
  {
    prefix: '/admin',
    pin: 'role:admin,cmd:*',
    map: {
      status: true, // GET /admin/status
    },
  },
]

const app = Express()
app.use(Express.json())

const seneca = Seneca({ log: 'warn' })
  .use(todo)
  .use(admin)
  .use(SenecaWeb, {
    adapter: require('seneca-web-adapter-express'),
    context: app,
    routes: routes,
    options: { parseBody: false },
  })

seneca.ready(function () {
  const server = app.listen(0, async function () {
    const base = 'http://127.0.0.1:' + server.address().port

    async function show(method, path, body) {
      const res = await fetch(base + path, {
        method: method,
        headers: { 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      console.log(method, path, '->', res.status, await res.json())
    }

    await show('GET', '/todo')
    await show('POST', '/todo', { text: 'run the examples' })
    await show('GET', '/todo/2')
    await show('GET', '/admin/status')

    // Routes can be added at any time with a role:web message.
    seneca.add('role:admin,cmd:version', function (msg, reply) {
      reply({ version: require('../../package.json').version })
    })

    seneca.act(
      'role:web',
      { routes: { prefix: '/admin', pin: 'role:admin,cmd:*', map: { version: true } } },
      async function (err) {
        if (err) throw err
        await show('GET', '/admin/version')
        server.close()
        seneca.close(function () {
          console.log('closed')
        })
      }
    )
  })
})
