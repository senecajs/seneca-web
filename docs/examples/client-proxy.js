
'use strict'

var Seneca = require('seneca')
var Web = require('../../')
var Assert = require('assert')

function plugin () {
  var seneca = this

  seneca.add('role:todo,cmd:new', (msg, done) => {
    console.log(msg)
    done(null, {ok: true})
  })

  seneca.add('role:todo,cmd:edit', (msg, done) => {
    var res = msg.request$
    var rep = msg.response$

    // These are not available over transport
    // as they are not plain objects. They get
    // stripped by before transportation.
    Assert(res)
    Assert(rep)

    rep(null, {
      params: res.params,
      info: res.info,
      headers: res.headers
    })

    done()
  })
}

var routes = [
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

var proxyServer = Seneca()

proxyServer
  .use(plugin)
  .listen({port: '4041'})

proxyServer.ready((err) => {
  var seneca = Seneca()

  seneca.use(Web, {server: {name: 'hapi'}})
        .use(plugin)
        .client({port: '4041', pin: 'role:todo,cmd:new'})


  seneca.ready(() => {
    seneca.act('role:web', {spec: routes})
  })
})
