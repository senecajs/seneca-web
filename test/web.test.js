'use strict'

const assert = require('assert')
const Seneca = require('seneca')
const Web = require('../')

// A minimal adapter that records what it was called with.
function makeAdapter(calls) {
  return function adapter(options, context, auth, routes, done) {
    calls.push({ seneca: this, options, context, auth, routes })
    done(null, { ok: true, routes })
  }
}

function pingRoutes(pin) {
  return { pin: pin || 'role:test,cmd:*', map: { ping: true } }
}

describe('web', () => {
  it('maps the routes given as plugin options through the adapter', (done) => {
    const calls = []
    const context = { name: 'ctx' }
    const auth = { authenticate: () => {} }

    const seneca = Seneca({ log: 'test' }).use(Web, {
      adapter: makeAdapter(calls),
      context,
      auth,
      routes: pingRoutes(),
      options: { parseBody: false },
    })

    seneca.ready(() => {
      assert.equal(calls.length, 1)
      // The adapter runs with a Seneca delegate as `this`.
      assert.equal(typeof calls[0].seneca.act, 'function')
      assert.equal(calls[0].seneca.id, seneca.id)
      assert.strictEqual(calls[0].context, context)
      assert.strictEqual(calls[0].auth, auth)
      assert.equal(calls[0].options.parseBody, false)
      assert.equal(calls[0].routes.length, 1)
      assert.equal(calls[0].routes[0].path, '/ping')
      assert.equal(calls[0].routes[0].pattern, 'role:test,cmd:ping')
      seneca.close(done)
    })
  })

  it('exports setServer, mapRoutes and context', (done) => {
    const calls = []
    const context = { name: 'exported' }

    const seneca = Seneca({ log: 'test' }).use(Web, {
      adapter: makeAdapter(calls),
      context,
      routes: null,
    })

    seneca.ready(() => {
      assert.equal(typeof seneca.export('web/setServer'), 'function')
      assert.equal(typeof seneca.export('web/mapRoutes'), 'function')
      assert.strictEqual(seneca.export('web/context')(), context)

      seneca.export('web/mapRoutes')({ routes: pingRoutes() }, (err, reply) => {
        if (err) return done(err)
        assert.equal(reply.routes.length, 1)
        assert.equal(calls.length, 1)
        assert.strictEqual(calls[0].context, context)
        seneca.close(done)
      })
    })
  })

  it('maps routes with role:web,routes:* using the stored server', (done) => {
    const calls = []
    const context = { name: 'stored' }

    const seneca = Seneca({ log: 'test' }).use(Web, {
      adapter: makeAdapter(calls),
      context,
      routes: null,
    })

    seneca.ready(() => {
      seneca.act('role:web', { routes: pingRoutes() }, (err, reply) => {
        if (err) return done(err)
        assert.equal(reply.ok, true)
        assert.equal(reply.routes.length, 1)
        assert.strictEqual(calls[0].context, context)
        seneca.close(done)
      })
    })
  })

  it('role:web,routes:* accepts a once off adapter, context and options', (done) => {
    const defaultCalls = []
    const onceCalls = []
    const onceContext = { name: 'once' }

    const seneca = Seneca({ log: 'test' }).use(Web, {
      adapter: makeAdapter(defaultCalls),
      context: { name: 'default' },
      routes: null,
    })

    seneca.ready(() => {
      const msg = {
        routes: pingRoutes(),
        adapter: makeAdapter(onceCalls),
        context: onceContext,
        options: { custom: true },
      }
      seneca.act('role:web', msg, (err) => {
        if (err) return done(err)
        assert.equal(defaultCalls.length, 0)
        assert.equal(onceCalls.length, 1)
        assert.strictEqual(onceCalls[0].context, onceContext)
        assert.deepEqual(onceCalls[0].options, { custom: true })

        // The once off values are not stored.
        seneca.act('role:web', { routes: pingRoutes() }, (err) => {
          if (err) return done(err)
          assert.equal(defaultCalls.length, 1)
          assert.equal(defaultCalls[0].context.name, 'default')
          seneca.close(done)
        })
      })
    })
  })

  it('role:web,set:server replaces the stored server', (done) => {
    const firstCalls = []
    const secondCalls = []
    const second = { name: 'second' }

    const seneca = Seneca({ log: 'test' }).use(Web, {
      adapter: makeAdapter(firstCalls),
      context: { name: 'first' },
      routes: null,
    })

    seneca.ready(() => {
      const msg = { adapter: makeAdapter(secondCalls), context: second }
      seneca.act('role:web,set:server', msg, (err, reply) => {
        if (err) return done(err)
        assert.deepEqual(reply, { ok: true })
        assert.strictEqual(seneca.export('web/context')(), second)

        seneca.act('role:web', { routes: pingRoutes() }, (err) => {
          if (err) return done(err)
          assert.equal(firstCalls.length, 0)
          assert.equal(secondCalls.length, 1)
          assert.strictEqual(secondCalls[0].context, second)
          seneca.close(done)
        })
      })
    })
  })

  it('role:web,set:server with routes stores the server and maps the routes', (done) => {
    const calls = []
    const context = { name: 'with-routes' }

    const seneca = Seneca({ log: 'test' }).use(Web, {
      adapter: makeAdapter(calls),
      context: { name: 'initial' },
      routes: null,
    })

    seneca.ready(() => {
      const msg = { context, routes: pingRoutes() }
      seneca.act('role:web,set:server', msg, (err, reply) => {
        if (err) return done(err)
        assert.equal(reply.routes.length, 1)
        assert.equal(calls.length, 1)
        assert.strictEqual(calls[0].context, context)
        assert.strictEqual(seneca.export('web/context')(), context)
        seneca.close(done)
      })
    })
  })

  it('role:web,set:server fails when the adapter is not a function', (done) => {
    const seneca = Seneca({ log: 'test' }).use(Web, {
      adapter: makeAdapter([]),
      routes: null,
    })

    seneca.ready(() => {
      seneca.act('role:web,set:server', { adapter: 'log' }, (err) => {
        assert.ok(err)
        assert.ok(/Provide a function as adapter/.test(err.message))
        seneca.close(done)
      })
    })
  })

  it('passes adapter errors back to the caller', (done) => {
    function failing(options, context, auth, routes, done) {
      done(new Error('adapter failed'))
    }

    const seneca = Seneca({ log: 'test' }).use(Web, {
      adapter: makeAdapter([]),
      routes: null,
    })

    seneca.ready(() => {
      const msg = { routes: pingRoutes(), adapter: failing }
      seneca.act('role:web', msg, (err) => {
        assert.ok(err)
        assert.ok(/adapter failed/.test(err.message))
        seneca.close(done)
      })
    })
  })

  it('sends web request messages that are not fatal, each in its own transaction', (done) => {
    const calls = []

    // If a request message were fatal, Seneca would close the instance
    // and exit instead of calling back; the stub keeps the process alive.
    const seneca = Seneca({ log: 'silent', system: { exit: () => {} } }).use(Web, {
      adapter: makeAdapter(calls),
      routes: pingRoutes(),
    })

    seneca.add('role:test,cmd:fail', (msg, reply) => {
      reply(new Error('expected failure'))
    })

    seneca.ready(() => {
      const adapterSeneca = calls[0].seneca
      adapterSeneca.act('role:test,cmd:fail', (err, out, meta) => {
        assert.ok(err)
        assert.ok(/expected failure/.test(err.message))
        assert.ok(!meta.fatal)

        adapterSeneca.act('role:test,cmd:fail', (err2, out2, meta2) => {
          assert.ok(err2)
          assert.notEqual(meta2.tx, meta.tx)
          seneca.close(done)
        })
      })
    })
  })

  it("keeps the route action's plugin context, so its error templates apply", (done) => {
    const calls = []

    function shop() {
      this.add('role:shop,cmd:get', function (msg, reply) {
        reply(this.error('missing_item', { id: msg.id }))
      })
    }
    shop.errors = { missing_item: 'Item <%=id%> is missing.' }

    const seneca = Seneca({ log: 'silent', system: { exit: () => {} } })
      .use(shop)
      .use(Web, {
        adapter: makeAdapter(calls),
        routes: { pin: 'role:shop,cmd:*', map: { get: true } },
      })

    seneca.ready(() => {
      calls[0].seneca.act('role:shop,cmd:get', { id: 'i0' }, (err) => {
        // Seneca catches errors thrown in callbacks, so report them.
        try {
          assert.ok(err)
          assert.equal(err.code, 'missing_item')
          assert.ok(/Item i0 is missing/.test(err.message), err.message)
        } catch (failure) {
          return seneca.close(() => done(failure))
        }
        seneca.close(done)
      })
    })
  })

  it('makes named middleware available to the adapter as options.middleware', (done) => {
    const calls = []
    const middleware = { first: () => {}, second: () => {} }

    const seneca = Seneca({ log: 'test' }).use(Web, {
      adapter: makeAdapter(calls),
      middleware,
      routes: {
        pin: 'role:test,cmd:*',
        middleware: 'first',
        map: { ping: { GET: true, middleware: ['second'] } },
      },
    })

    seneca.ready(() => {
      assert.equal(calls.length, 1)
      assert.strictEqual(calls[0].options.middleware, middleware)
      assert.deepEqual(calls[0].routes[0].middleware, ['first', 'second'])
      seneca.close(done)
    })
  })
})
