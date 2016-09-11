'use strict'

const Lab = require('lab')
const Code = require('code')
const Mapper = require('../lib/mapper')

const expect = Code.expect
const lab = exports.lab = Lab.script()
const describe = lab.describe
const it = lab.it

describe('map-routes', () => {
  it('handles empty input', (done) => {
    var result = Mapper([])
    expect(result.length).to.be.equal(0)

    done()
  })

  it('Missing values are normalized', (done) => {
    const route = {
      pin: 'role:test,cmd:*',
      map: {
        ping: true
      }
    }

    var result = Mapper(route)[0]
    expect(result.methods).to.be.equal(['GET'])
    expect(result.prefix).to.be.false()
    expect(result.postfix).to.be.false()
    expect(result.alias).to.be.false()
    expect(result.autoreply).to.be.true()
    expect(result.redirect).to.be.false()
    expect(result.auth).to.be.false()
    expect(result.secure).to.be.false()

    done()
  })

  it('The value of quick maps are not considered', (done) => {
    const route = {
      pin: 'role:test,cmd:*',
      map: {
        ping: 0,
        pong: 'string'
      }
    }

    var result = Mapper(route)
    expect(result.length).to.be.equal(2)
    expect(result[0].methods).to.be.equal(['GET'])
    expect(result[1].methods).to.be.equal(['GET'])

    done()
  })

  it('fails if no pin is provided', (done) => {
    const route = {
      map: {
        ping: true
      }
    }

    var result = Mapper(route)
    expect(result.length).to.be.equal(0)

    done()
  })

  it('can handle custom pins', (done) => {
    const route = {
      pin: 'ns:api,handle:*',
      map: {
        ping: true
      }
    }

    var result = Mapper(route)[0]
    expect(result.pin).to.be.equal('ns:api,handle:*')
    expect(result.pattern).to.be.equal('ns:api,handle:ping')
    expect(result.path).to.be.equal('/ping')

    done()
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

    var result = Mapper(route)[0]
    expect(result.path).to.be.equal('/foo/bar')
    done()
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

    var result = Mapper(route)[0]
    expect(result.autoreply).to.be.equal(false)

    done()
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

    var result = Mapper(route)[0]
    expect(result.prefix).to.be.equal('api')
    expect(result.postfix).to.be.equal('v1')
    expect(result.path).to.equal('/api/ping/v1')

    done()
  })

  it('does not need a prefix or postfix', (done) => {
    const route = {
      pin: 'role:test,cmd:*',
      map: {
        ping: true
      }
    }

    var result = Mapper(route)[0]
    expect(result.methods).to.equal(['GET'])
    expect(result.path).to.equal('/ping')

    done()
  })
})
