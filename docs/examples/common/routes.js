'use strict'

module.exports = [
  {
    prefix: '/todo',
    pin: 'role:todo,cmd:*',
    map: {
      list: true,
      edit: {
        GET: true
      }
    }
  },
  {
    prefix: '/admin',
    pin: 'role:admin,cmd:*',
    map: {
      validate: {
        POST: true,
        alias: '/manage'
      }
    }
  }
]
