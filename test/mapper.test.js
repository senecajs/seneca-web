'use strict'

const assert = require('assert')
const Mapper = require('../lib/mapper')

describe('map-routes', () => {
  it('handles empty input', done => {
    var result = Mapper([])
    assert.equal(result.length, 0)

    done()
  })

  it('Missing values are normalized', done => {
    const route = {
      pin: 'role:test,cmd:*',
      map: {
        ping: true
      }
    }

    var result = Mapper(route)[0]
    assert.deepEqual(result.methods, ['GET'])
    assert.equal(result.prefix, false)
    assert.equal(result.postfix, false)
    assert.equal(result.suffix, false)
    assert.equal(result.alias, false)
    assert.equal(result.autoreply, true)
    assert.equal(result.redirect, false)
    assert.equal(result.auth, false)
    assert.equal(result.secure, false)

    done()
  })

  it('The value of quick maps are not considered', done => {
    const route = {
      pin: 'role:test,cmd:*',
      map: {
        ping: 0,
        pong: 'string'
      }
    }

    var result = Mapper(route)
    assert.equal(result.length, 2)
    assert.deepEqual(result[0].methods, ['GET'])
    assert.deepEqual(result[1].methods, ['GET'])

    done()
  })

  it('fails if no pin is provided', done => {
    const route = {
      map: {
        ping: true
      }
    }

    var result = Mapper(route)
    assert.equal(result.length, 0)

    done()
  })

  it('can handle custom pins', done => {
    const route = {
      pin: 'ns:api,handle:*',
      map: {
        ping: true
      }
    }

    var result = Mapper(route)[0]
    assert.equal(result.pin, 'ns:api,handle:*')
    assert.equal(result.pattern, 'ns:api,handle:ping')
    assert.equal(result.path, '/ping')

    done()
  })

  it('can specify custom route alias', done => {
    const route = {
      pin: 'role:api,cmd:*',
      map: {
        ping: {
          alias: 'foo/bar',
          GET: 'true'
        }
      }
    }

    var result = Mapper(route)[0]
    assert.equal(result.path, '/foo/bar')
    done()
  })

  it('can specify custom auto reply', done => {
    const route = {
      pin: 'role:api,cmd:*',
      map: {
        ping: {
          autoreply: false,
          GET: 'true'
        }
      }
    }

    var result = Mapper(route)[0]
    assert.equal(result.autoreply, false)

    done()
  })

  it('prefixes prefix, postfixes postfix, suffixes suffix', done => {
    const route = {
      pin: 'role:test,cmd:*',
      prefix: 'api',
      postfix: 'v1',
      map: {
        ping: {
          GET: true,
          suffix: '/:param'
        }
      }
    }

    var result = Mapper(route)[0]
    assert.equal(result.prefix, 'api')
    assert.equal(result.postfix, 'v1')
    assert.equal(result.suffix, '/:param')
    assert.equal(result.path, '/api/ping/v1/:param')

    done()
  })

  it('does not need a prefix or postfix', done => {
    const route = {
      pin: 'role:test,cmd:*',
      map: {
        ping: true
      }
    }

    var result = Mapper(route)[0]
    assert.deepEqual(result.methods, ['GET'])
    assert.equal(result.path, '/ping')

    done()
  })

  it('allows overwriting of the key', done => {
    const route = {
      pin: 'role:user,cmd:*',
      map: {
        a: { GET: true, name: 'w' },
        b: { GET: true, name: 'x' },
        c: { GET: true, name: 'y' },
        d: { GET: true, name: 'z' }
      }
    }

    var results = Mapper(route)

    assert.deepEqual(results.map(result => result.path), [
      '/w',
      '/x',
      '/y',
      '/z'
    ])
    done()
  })

  describe('specifying middleware', () => {
    let route = null

    beforeEach(done => {
      route = {
        pin: 'role:api,cmd:*',
        map: {
          ping: {
            GET: 'true'
          }
        }
      }
      done()
    })

    it('at root, string', done => {
      route.middleware = 'middleware'
      const result = Mapper(route)
      assert.deepEqual(result[0].middleware, ['middleware'])
      done()
    })

    it('at root, array', done => {
      route.middleware = ['middleware']
      const result = Mapper(route)
      assert.deepEqual(result[0].middleware, ['middleware'])
      done()
    })

    it('per route, string', done => {
      route.map.ping.middleware = 'middleware'
      const result = Mapper(route)
      assert.deepEqual(result[0].middleware, ['middleware'])
      done()
    })

    it('per route, array', done => {
      route.map.ping.middleware = ['middleware']
      const result = Mapper(route)
      assert.deepEqual(result[0].middleware, ['middleware'])
      done()
    })

    it('value overwrites root', done => {
      route.middleware = ['by our powers']
      route.map.ping.middleware = ['combined!']
      const result = Mapper(route)
      assert.deepEqual(result[0].middleware, ['by our powers', 'combined!'])
      done()
    })
  })
})
