'use strict'

var Seneca = require('seneca')()
var Web = require('../../')

// The 'log' adapter switch logs mapped input to the console window in
// pretty format. The log switch can be turned used in debug scenario's
// to check the routes that have been generated.

Seneca.use(Web, {
  adapter: 'log',
  routes: {
    pin: 'role:admin,cmd:*',
    map: {
      home: {
        GET: true,
        POST: true,
        alias: '/'
      },
      logout: {
        GET: true,
        redirect: '/'
      },
      profile: {
        GET: true,
        secure: {
          fail: '/'
        }
      },
      login: {
        POST: true,
        auth: {
          strategy: 'local',
          pass: '/profile',
          fail: '/'
        }
      }
    }
  }
})
