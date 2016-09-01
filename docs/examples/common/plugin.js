'use strict'

module.exports = function plugin () {
  var seneca = this

  seneca.add('role:todo,cmd:new', (msg, done) => {
    done(null, {ok: true})
  })

  seneca.add('role:todo,cmd:edit', (msg, done) => {
    var res = msg.request$
    var rep = msg.response$

    rep.send({
      params: res.params,
      info: res.info,
      headers: res.headers
    })

    done()
  })

  seneca.add('role:admin,cmd:validate', (msg, done) => {
    done(null, {ok: true})
  })
}
