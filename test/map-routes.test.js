'use strict'

let expect = require('code').expect
let Lab = require('lab')

let lab = exports.lab = Lab.script()
let describe = lab.describe
let it = lab.it

let mapRoutes = require('../lib/map-routes')

let noRoutes = []

let singleRoute = [
  {
    prefix: '/api',
    pin: 'role:test,cmd:*',
    map: {
      ping: true
    }
  }
]

let multipleRoutes = [
  {
    prefix: '/api',
    pin: 'role:test,cmd:*',
    map: {
      ping: true,
      pong: true
    }
  }
]

let singleAutoReplyFalse = [
  {
    prefix: '/api',
    pin: 'role:test,cmd:*',
    map: {
      ping: {GET: true, POST: false, autoreply: false}
    }
  }
]


describe('map-routes', () => {
  
  it('keeps the specified methods', function (done) {
    expect(mapRoutes(singleAutoReplyFalse)[0].methods).to.equal(['GET'])
    done()
  })
  
  it('does not fail if the routes array is empty', (done) => {
    expect(mapRoutes(noRoutes)).to.equal([])
    done()
  })
  
  it('builds a single route from a single definition', (done) => {
    expect(mapRoutes(singleRoute).length).to.equal(1)
    done()
  })
  
  it('defaults autoreply to true', (done) => {
    expect(mapRoutes(singleRoute)[0].autoreply).to.equal(true)
    done()
  })
  
  it('respects autoreply if set to false', (done) => {
    expect(mapRoutes(singleAutoReplyFalse)[0].autoreply).to.equal(false)
    done()
  })
  
  it('builds the correct path', (done) => {
    expect(mapRoutes(singleRoute)[0].path).to.equal('/api/ping')
    done()
  })
  
  it('expands multiple routes', (done) => {
    expect(mapRoutes(multipleRoutes).length).to.equal(2)
    done()
  })
})
