'use strict'

var Seneca = require('seneca')
var Web = require('../../')
var Hapi = require('hapi')
var Basic = require('hapi-auth-basic')
var Repo = require('./common/repo')

// The config for our routes
var Routes = [{
  pin: 'role:admin,cmd:*',
  map: {
    home: {
      GET: true,
      POST: true,
      alias: '/'
    },
    profile: {
      GET: true,
      auth: {
        strategy: 'simple',
        fail: '/'
      }
    },
    admin: {
      GET: true,
      auth: {
        strategy: 'simple',
        pass: '/profile',
        fail: '/'
      }
    }
  }
}]

// Plugin to handle our routes
function Plugin () {
  var seneca = this

  seneca.add('role:admin,cmd:home', (msg, done) => {
    done(null, {ok: true, message: 'please log in...'})
  })

  seneca.add('role:admin,cmd:profile', (msg, done) => {
    done(null, {ok: true, user: msg.args.user})
  })
}

var app = new Hapi.Server()
app.connection({port: 4050})

function validate (request, username, password, done) {
  Repo.users.findByUsername(username, (err, user) => {
    if (err) {
      done(err)
    }
    else if (!user) {
      done(null, false)
    }
    else if (user.password !== password) {
      done(null, false)
    }
    else {
      done(null, true, user)
    }
  })
}

app.register(Basic, (err) => {
  if (err) throw err

  app.auth.strategy('simple', 'basic', {validateFunc: validate})

  // The config we will pass to seneca-web
  var config = {
    adapter: require('seneca-web-adapter-hapi'),
    context: app,
    routes: Routes
  }

  // Server and start as usual.

  var seneca = Seneca()
    .use(Plugin)
    .use(Web, config)
    .ready(() => {
      var server = seneca.export('web/context')()

      server.start((err) => {
        console.log(err || 'server started on: ' + server.info.uri)
      })
    })
})
