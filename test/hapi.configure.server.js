"use strict";

var assert = require ( 'assert' )

var Chairo = require ( 'chairo' )
const Hapi = require ( 'hapi' )

var server = new Hapi.Server ()
server.connection()

var seneca

exports.init = function ( done ) {

  server.register(
    {
      register: Chairo,
      options: {
        'default_plugins': {
          'web': false
        },
        web_plugin: require ( '..' )
      }
    }, function ( err ) {
      console.log( 'Server registered Chairo', err )
      seneca = server.seneca

      server.start( function () {
        console.log( 'Server started' )

        console.log( 'Server running at:', server.info.uri );

        seneca.add( 'role:api,cmd:c0', function ( args, done ) {
          var out = {
            something:'else'
          }
          done ( null, out )
        } )

        seneca.add( 'role:api,cmd:c1', function ( msg, done ) {
          var out = {
            m: msg.req$.params.m
          }

          done ( null, out )
        } )

        seneca.act( 'role:web', {
          use: {
            prefix: '/t0',
            pin: 'role:api,cmd:*',
            map: {
              c0: { GET: true, alias: '/a0' },
              c1: { GET: true, alias: '/a0/{m}' }
            }
          }
        }, function(){
          done(null, server)
        } )



      } )
    } )
}
