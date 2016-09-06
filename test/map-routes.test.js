'use strict'

const Lab = require('lab')
const Code = require('code')
const MapRoutes = require('../lib/map-routes')

const expect = Code.expect
const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it

describe('map-routes', () => {
  it('handles empty input', (done) => {
    MapRoutes([], (result) => {
      expect(result.ok).to.be.true()
      expect(result.routes.length).to.be.equal(0)
      done()
    })
  })

  it('Missing values are normalized', (done) => {
    const route = {
      pin: 'role:test,cmd:*',
      map: {
        ping: true
      }
    }

    MapRoutes(route, (result) => {
      result = result.routes[0]

      expect(result.prefix).to.be.null()
      expect(result.postfix).to.be.null()
      expect(result.alias).to.be.null()
      expect(result.autoreply).to.be.equal(true)
      done()
    })
  })

  it('The value quick map keys is not considered', (done) => {
    const route = {
      pin: 'role:test,cmd:*',
      map: {
        ping: 0,
        pong: 'string'
      }
    }

    MapRoutes(route, (result) => {
      expect(result.routes.length).to.be.equal(2)
      expect(result.routes[0].methods).to.be.equal(['GET'])
      expect(result.routes[1].methods).to.be.equal(['GET'])
      done()
    })
  })

  it('fails if no pin is provided', (done) => {
    const route = {
      map: {
        ping: true
      }
    }

    MapRoutes(route, (result) => {
      expect(result.ok).to.be.false()
      expect(result.why).to.be.equal('missing pin')
      expect(result.routes).to.be.undefined()
      done()
    })
  })

  it('can handle custom pins', (done) => {
    const route = {
      pin: 'ns:api,handle:*',
      map: {
        ping: true
      }
    }

    MapRoutes(route, (result) => {
      result = result.routes[0]

      expect(result.pin).to.be.equal('ns:api,handle:*')
      expect(result.pattern).to.be.equal('ns:api,handle:ping')
      expect(result.path).to.be.equal('/ping')

      done()
    })
  })

  it('can specify custom route alias', (done) => {
    const route = {
      pin: 'role:api,cmd:*',
      map: {
        ping: {
          alias: 'foo/bar',
          GET: 'true'
        }
      }
    }

    MapRoutes(route, (result) => {
      result = result.routes[0]

      expect(result.path).to.be.equal('/foo/bar')

      done()
    })
  })

  it('can specify custom auto reply', (done) => {
    const route = {
      pin: 'role:api,cmd:*',
      map: {
        ping: {
          autoreply: false,
          GET: 'true'
        }
      }
    }

    MapRoutes(route, (result) => {
      result = result.routes[0]

      expect(result.autoreply).to.be.equal(false)

      done()
    })
  })

  it('prefixes prefix, postfixes postfix', (done) => {
    const route = {
      pin: 'role:test,cmd:*',
      prefix: 'api',
      postfix: 'v1',
      map: {
        ping: true
      }
    }

    MapRoutes(route, (result) => {
      result = result.routes[0]

      expect(result.prefix).to.be.equal('api')
      expect(result.postfix).to.be.equal('v1')
      expect(result.path).to.equal('/api/ping/v1')

      done()
    })
  })

  it('does not need a prefix or postfix', (done) => {
    const route = {
      pin: 'role:test,cmd:*',
      map: {
        ping: true
      }
    }

    MapRoutes(route, (result) => {
      result = result.routes[0]

      expect(result.methods).to.equal(['GET'])
      expect(result.path).to.equal('/ping')
      expect(result.prefix).to.be.null()

      done()
    })
  })
})
