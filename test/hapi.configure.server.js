"use strict";

var assert = require ( 'assert' )

var Chairo = require ( 'chairo' )
const Hapi = require ( 'hapi' )
var _ = require('lodash')

exports.init = function ( done ) {
  var server = new Hapi.Server ()
  server.connection()
  var seneca

  server.register(
    {
      register: Chairo,
      options: {
        web: require ( '..' )
      }
    }, function ( err ) {
      console.log( 'Server registered Chairo', err )
      seneca = server.seneca

      server.start( function () {
        console.log( 'Server started' )
        console.log( 'Server running at:', server.info.uri );

        function c0(msg, done){
          var out = _.extend(
            {
              t: 'c0'
            },
            msg.req$.params,
            msg.req$.query
          )

          done ( null, out )
        }

        function c1(msg, done){
          var out = _.extend(
            {
              t: 'c1'
            },
            msg.req$.params,
            msg.req$.query
          )

          done ( null, out )
        }

        function c2(msg, done){
          var out = _.extend(
            {
              t: 'c2'
            },
            msg.req$.params,
            msg.req$.query,
            msg.req$.payload
          )

          done ( null, out )
        }

        function e1(msg, done){
          done ( new Error('some error') )
        }

        seneca.add( 'role:api,cmd:c0', c0 )
        seneca.add( 'role:api,cmd:c1', c1 )
        seneca.add( 'role:api,cmd:c2', c2 )
        seneca.add( 'role:api,cmd:e1', e1 )

        seneca.act( 'role:web', {
          use: {
            startware: function ( req, next ) {
              req.params.x0 = 'y0'

              next ()
            },
            prefix: '/t0',
            pin: 'role:api,cmd:*',
            map: {
              c0: { GET: true, alias: '/a0' },
              c1: { GET: true, POST: true, alias: '/a0/{m}' },
              c2: { POST: true, alias: '/c0/{m}' },
              e1: { GET: true, alias: '/e1' }
            }
          }
        }, function () {

          seneca.act( 'role:web', {
            use: {
              prefix: '/r0',
              pin: 'role:api,cmd:*',
              map: {
                c0: { GET: true, alias: '/x0' }
              }
            }
          }, function () {
            done ( null, server )
          } )

        } )
      } )
    } )
}
