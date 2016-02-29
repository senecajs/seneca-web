'use strict'

// DO NOT RUN HAPI TESTS FOR NODE LESS THAN 4.0.0
if (process.version < 'v4.0.0') {
  return
}

var _ = require('lodash')
var Chairo = require('chairo')
var Hapi = require('hapi')
var Web = require('../')

exports.init = function (done) {
  var server = new Hapi.Server()
  server.connection()

  server.register({
    register: Chairo,
    options: {
      log: 'silent',
      web: Web
    }
  }, function (err) {
    if (err) {
      return done(err)
    }

    var seneca = server.seneca

    function c0 (msg, cb) {
      var out = _.extend(
        {
          t: 'c0'
        },
        msg.req$.params,
        msg.req$.query
      )

      cb(null, out)
    }

    function c1 (msg, cb) {
      var out = {
        t: 'c1',
        m: msg.m,
        x0: msg.x0,
        a1: msg.a1,
        a2: msg.a2
      }

      cb(null, out)
    }

    function c2 (msg, cb) {
      var out = _.extend(
        {
          t: 'c2'
        },
        msg.req$.params,
        msg.req$.query,
        msg.req$.payload
      )

      cb(null, out)
    }

    function e1 (msg, cb) {
      cb(new Error('some error'))
    }

    function x1 (args, cb) {
      cb(null, {x: args.x})
    }

    function x2 (args, cb) {
      if (args.data && args.data.x) {
        return cb(null, {x: args.data.x, loc: 1})
      }
      cb(null, {x: args.x, loc: 0})
    }

    seneca
      .add('role:api,cmd:c0', c0)
      .add('role:api,cmd:c1', c1)
      .add('role:api,cmd:c2', c2)
      .add('role:api,cmd:e1', e1)
      .add('role:api,cmd:x1', x1)
      .add('role:api,cmd:x2', x2)

    seneca.ready(function () {
      seneca.act('role:web', {
        use: {
          startware: function (req, next) {
            req.params.x0 = 'y0'

            next()
          },
          prefix: '/t0',
          pin: 'role:api,cmd:*',
          map: {
            c0: {GET: true, alias: '/a0'},
            c1: {GET: true, POST: true, alias: '/a0/:m'},
            c2: {POST: true, alias: '/c0/:m'},
            e1: {GET: true, alias: '/e1'},
            x1: {POST: true},
            x2: {POST: true, data: true}
          }
        }
      }, function () {
        seneca.act('role:web', {
          use: {
            prefix: '/r0',
            pin: 'role:api,cmd:*',
            map: {
              c0: {GET: true, alias: '/x0'}
            }
          }
        }, function () {
          done(null, server)
        })
      })
    })
  })
}
