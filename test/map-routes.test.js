'use strict'

const Lab = require('lab')
const Code = require('code')
const MapRoutes = require('../lib/map-routes')

const expect = Code.expect
const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it

const noRoutes = []

const singleRoute = {
  prefix: '/api',
  pin: 'role:test,cmd:*',
  map: {
    ping: true
  }
}

const multipleRoutes = {
  prefix: '/api',
  pin: 'role:test,cmd:*',
  map: {
    ping: true,
    pong: true
  }
}

const multipleDiscreetRoutes = [{
  prefix: '/api',
  pin: 'role:test,cmd:*',
  map: {
    pong: true
  },
}, {
  prefix: '/api',
  pin: 'role:test,cmd:*',
  map: {
    pong: true
  },
}]

const singleAutoReplyFalse = {
  prefix: '/api',
  pin: 'role:test,cmd:*',
  map: {
    ping: {
      GET: true,
      POST: false,
      autoreply: false
    }
  }
}

describe('map-routes', () => {
  it('keeps the specified methods', (done) => {
    expect(MapRoutes(singleAutoReplyFalse)[0].methods).to.equal(['GET'])
    done()
  })

  it('does not fail if the routes array is empty', (done) => {
    expect(MapRoutes(noRoutes)).to.equal([])
    done()
  })

  it('builds a single route from a single definition', (done) => {
    expect(MapRoutes(singleRoute).length).to.equal(1)
    done()
  })

  it('defaults autoreply to true', (done) => {
    expect(MapRoutes(singleRoute)[0].autoreply).to.equal(true)
    done()
  })

  it('respects autoreply if set to false', (done) => {
    expect(MapRoutes(singleAutoReplyFalse)[0].autoreply).to.equal(false)
    done()
  })

  it('builds the correct path', (done) => {
    expect(MapRoutes(singleRoute)[0].path).to.equal('/api/ping')
    done()
  })

  it('handles multiple discreet routes', (done) => {
    var result = MapRoutes(multipleDiscreetRoutes)

    expect(result.length).to.equal(2)
    expect(result[0].methods).to.equal(['GET'])
    expect(result[1].methods).to.equal(['GET'])

    done()
  })

  it('expands multiple routes', (done) => {
    expect(MapRoutes(multipleRoutes).length).to.equal(2)
    done()
  })

  if ('needs a pin', (done) => {
    const route = {
      map: {
        ping: true
      }
    }

    var result = MapRoutes(route)

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

    var result = MapRoutes(route)
    expect(result.length).to.equal(1)
    expect(result[0].methods).to.equal(['GET'])
    expect(result[0].prefix).to.be.equal('api')
    expect(result[0].postfix).to.be.equal('v1')
    expect(result[0].path).to.equal('/api/ping/v1')

    done()
  })

  it('does not need a prefix or postfix', (done) => {
    const route = {
      pin: 'role:test,cmd:*',
      map: {
        ping: true,
        pong: true
      }
    }

    var result = MapRoutes(route)
    expect(result.length).to.equal(2)

    var ping = result[0]
    expect(ping.methods).to.equal(['GET'])
    expect(ping.path).to.equal('/ping')
    expect(ping.prefix).to.be.null()

    done()
  })
})
