var Promise = require('bluebird')

var seneca = require('seneca')({
  default_plugins: {
    web: false
  }
})
seneca.use('../web.js')

seneca.add('role:foo,cmd:zig', function (args, done) {
  done(null, {
    bar: args.zoo + 'g'
  })
})

seneca.add('role:foo,cmd:bar', function (args, done) {
  done(null, {
    bar: args.zoo + 'b'
  })
})

seneca.add('role:foo,cmd:qaz', function (args, done) {
  done(null, {
    qaz: args.zoo + 'z'
  })
})

seneca.add('role:foo, cmd:aliasGet', function (args, done) {
  done(null, {
    alias: 'get'
  })
})

seneca.add('role:foo, cmd:aliasPost', function (args, done) {
  done(null, {
    alias: 'post'
  })
})

seneca.add('role:foo, cmd:aliasPut', function (args, done) {
  done(null, {
    alias: 'put'
  })
})

seneca.add('role:foo, cmd:aliasDel', function (args, done) {
  done(null, {
    alias: 'del'
  })
})

seneca.add('role:foo, cmd:aliasToken', function (args, done) {
  done(null, {
    token: args.req$.params.token
  })
})

seneca.act('role:web', {
  use: {
    prefix: '/my-api',
    pin: {
      role: 'foo',
      cmd: '*'
    },
    map: {
      zig: true,
      bar: {
        GET: true
      },
      qaz: {
        GET: true,
        POST: true
      },
      aliasGet: {
        GET: true,
        alias: 'this/is/an/alias'
      },
      aliasPost: {
        POST: true,
        alias: 'this/is/an/alias'
      },
      aliasPut: {
        PUT: true,
        alias: 'this/is/an/alias'
      },
      aliasDel: {
        DELETE: true,
        alias: 'this/is/an/alias'
      },
      aliasToken: {
        GET: true,
        alias: 'this/is/an/alias/:token'
      }
    }
  }
})

seneca.add('zed:1', function (args, done) {
  done(null, {
    dez: 2
  })
})

seneca.act('role:web', {
  use: function (req, res, next) {
    if (req.url === '/zed') {
      // NOTE: req.seneca reference
      req.seneca.act('zed:1', function (err, out) {
        if (err) return next(err)
        // assumes an express app
        res.send(out)
      })
    } else {
      return next()
    }
  }
})

seneca.add('role:color,cmd:red', function (args, done) {
  done(null, {
    color: '#F00'
  })
})

seneca.add('role:color,cmd:green', function (args, done) {
  done(null, {
    color: '#0F0'
  })
})

seneca.add('role:color,cmd:blue', function (args, done) {
  done(null, {
    color: '#00F'
  })
})

seneca.act('role:web', {
  use: {
    prefix: '/color',
    pin: 'role:color,cmd:*',
    map: {
      red: true,
      green: true,
      blue: true
    }
  }
})

seneca.add('role:api,cmd:echo', function (args, done) {
  done(null, args)
})

seneca.act('role:web', {
  use: {
    prefix: '/api',
    pin: 'role:api,cmd:*',
    map: {
      echo: {
        POST: true,
        suffix: '/:foo'
      }
    }
  }
})

var app = require('express')()
app.use(require('body-parser').json())
app.use(seneca.export('web'))
module.exports = function (TEST) {
  return new Promise(function (resolve) {
    if (!TEST) {
      app.listen(3000)
    }
    seneca.ready(function () {
      resolve(app)
    })
  })
}

// run: node test/example.js --seneca.log=type:act

// try curl -m 1 -s http://localhost:3000/my-api/bar?zoo=a
// returns {"bar":"ab"}

// try curl -m 1 -s -H 'Content-Type: application/json' -d '{"zoo":"b"}' http://localhost:3000/my-api/qaz
// returns {"qaz":"bz"}

// try curl -m 1 -s -H 'Content-Type: application/json' -d '{"zed":"c"}' http://localhost:3000/api/echo/a?bar=b
// returns {"foo":"a", "bar":"b", "zed":"c", }
