'use strict'

var Chairo = require('chairo')
const Hapi = require('hapi')
var _ = require('lodash')

exports.init = function (done) {
  var server = new Hapi.Server()
  server.connection()
  var seneca

  server.register(
    {
      register: Chairo,
      options: {
        log: 'print',
        web: require('..')
      }
    }, function (err) {
      console.log('Server registered Chairo', err)
      seneca = server.seneca

      server.start(function () {
        console.log('Server started')
        console.log('Server running at:', server.info.uri)

        function c0 (msg, done) {
          var out = _.extend(
            {
              t: 'c0'
            },
            msg.req$.params,
            msg.req$.query
          )

          done(null, out)
        }

        function c1 (msg, done) {
          var out = {
            t: 'c1',
            m: msg.m,
            x0: msg.x0,
            a1: msg.a1,
            a2: msg.a2
          }

          done(null, out)
        }

        function c2 (msg, done) {
          var out = _.extend(
            {
              t: 'c2'
            },
            msg.req$.params,
            msg.req$.query,
            msg.req$.payload
          )

          done(null, out)
        }

        function e1 (msg, done) {
          done(new Error('some error'))
        }

        function x1 (args, done) {
          done(null, {x: args.x})
        }

        function x2 (args, done) {
          if (args.data && args.data.x) {
            return done(null, {x: args.data.x, loc: 1})
          }
          done(null, {x: args.x, loc: 0})
        }

        function s1 (args, done) {
          done(null, {http$: {status: 401}})
        }

        function s2 (args, done) {
          done(null, {http$: {status: 302, redirect: '/myPath'}})
        }

        seneca
          .add('role:api,cmd:c0', c0)
          .add('role:api,cmd:c1', c1)
          .add('role:api,cmd:c2', c2)
          .add('role:api,cmd:e1', e1)
          .add('role:api,cmd:x1', x1)
          .add('role:api,cmd:x2', x2)
          .add('role:api,cmd:s1', s1)
          .add('role:api,cmd:s2', s2)

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
              x2: {POST: true, data: true},
              s1: {GET: true},
              s2: {GET: true}
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
