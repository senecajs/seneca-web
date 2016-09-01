'use strict'

module.exports = [
  {
    prefix: '/todo',
    pin: 'role:todo,cmd:*',
    map: {
      new: true,
      edit: {
        autoreply: false,
        GET: true,
        POST: true
      },
      delete: {
        DELETE: true
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
