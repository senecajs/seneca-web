
'use strict'

var Seneca = require('seneca')
var Web = require('../../')

function plugin () {
  var seneca = this

  seneca.add('role:todo,cmd:new', (msg, done) => {
    done(null, {ok: true})
  })

  seneca.add('role:todo,cmd:edit', (msg, done) => {
    var res = msg.request$
    var rep = msg.response$

    rep(null, {
      params: res.params,
      info: res.info,
      headers: res.headers
    })

    done() 
  })
}

var seneca = Seneca()

seneca.use(Web, {server: {name: 'log'}})
      .use(plugin)

seneca.ready(() => {
  seneca.act('role:web', {
    spec: [
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
  })
})
