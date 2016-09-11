'use strict'

module.exports = function plugin () {
  var seneca = this

  seneca.add('role:todo,cmd:list', (msg, done) => {
    done(null, {ok: true})
  })

  seneca.add('role:todo,cmd:edit', (msg, done) => {
    var rep = msg.response$

    // Custom handlers send back request and response
    // Objects who may not have the same shape. Bear
    // in mind accessing these objects limits the
    // ability to swap frameworks easily.
    if (rep.send) {
      rep.send(msg.args)
    }
    else {
      rep(null, msg.args)
    }

    done()
  })

  seneca.add('role:admin,cmd:validate', (msg, done) => {
    done(null, {ok: true, args: msg.args})
  })
}
