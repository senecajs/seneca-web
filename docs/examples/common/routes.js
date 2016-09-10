'use strict'

module.exports = [
  {
    prefix: '/todo',
    pin: 'role:todo,cmd:*',
    auth: {
      strategy: 'local',
      fail: '/login'
    },
    map: {
      list: true,
      edit: {
        autoreply: false,
        GET: true,
        POST: true
      }
    }
  },
  {
    prefix: '/admin',
    pin: 'role:admin,cmd:*',
    map: {
      validate: {
        GET: true,
        alias: '/login',
        auth: {
          strategy: 'local',
          pass: '/',
          fail: '/login'
        }
      }
    }
  }
]
