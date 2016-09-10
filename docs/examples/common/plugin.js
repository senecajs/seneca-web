'use strict'

module.exports = function plugin () {
  var seneca = this

  seneca.add('role:todo,cmd:list', (msg, done) => {
    done(null, {ok: true})
  })

  seneca.add('role:todo,cmd:edit', (msg, done) => {
    // Bear in mind these CANNOT be accessed over
    // transport. The transport layer will scrub
    // both of these as they aren't plain objects.
    var res = msg.request$
    var rep = msg.response$

    // Custom handlers send back request and response
    // Objects who may not have the same shape. Bear
    // in mind accessing these objects limits the
    // ability to swap frameworks easily.
    if (rep.send) {
      rep.send({
        params: res.params,
        info: res.info,
        headers: res.headers
      })
    }
    else {
      rep(null, {
        params: res.params,
        info: res.info,
        headers: res.headers
      })
    }

    done()
  })

  seneca.add('role:admin,cmd:validate', (msg, done) => {
    done(null, {ok: true})
  })
}
