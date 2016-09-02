'use strict'

module.exports = [
  {
    prefix: '/todo',
    pin: 'role:todo,cmd:*',
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
        alias: '/login',
        GET: true,
      },
      signoff: true,
    }
  }
]
