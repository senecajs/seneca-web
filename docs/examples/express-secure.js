'use strict'

var Seneca = require('seneca')
var Web = require('../../')
var Express = require('express')
var Passport = require('passport')
var Strategy = require('passport-local').Strategy
var CookieParser = require('cookie-parser')
var BodyParser = require('body-parser')
var Session = require('express-session')
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
    logout: {
      GET: true,
      redirect: '/'
    },
    profile: {
      GET: true,
      secure: {
        fail: '/'
      }
    },
    login: {
      POST: true,
      auth: {
        strategy: 'local',
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

  seneca.add('role:admin,cmd:logout', (msg, done) => {
    msg.request$.logout()

    done(null, {ok: true})
  })

  seneca.add('role:admin,cmd:profile', (msg, done) => {
    done(null, {ok: true, user: msg.args.user})
  })
}

// Set our custom strategy in passport, plus user serialization.
Passport.use(new Strategy((username, password, cb) => {
  Repo.users.findByUsername(username, (err, user) => {
    if (err) {
      cb(err)
    }
    else if (!user) {
      cb(null, false)
    }
    else if (user.password !== password) {
      cb(null, false)
    }
    else {
      cb(null, user)
    }
  })
}))

Passport.serializeUser((user, cb) => {
  cb(null, user.id)
})

Passport.deserializeUser((id, cb) => {
  Repo.users.findById(id, (err, user) => {
    if (err) {
      return cb(err)
    }
    else {
      cb(null, user)
    }
  })
})

// Prep express
var app = Express()
app.use(CookieParser())
app.use(BodyParser.urlencoded({extended: true}))
app.use(Session({secret: 'magically', resave: false, saveUninitialized: false}))
app.use(Passport.initialize())
app.use(Passport.session())

// The config we will pass to seneca-web
var config = {
  adapter: 'express',
  context: app,
  routes: Routes,
  auth: Passport
}

// Server and start as usual.

var seneca = Seneca()
  .use(Plugin)
  .use(Web, config)
  .ready(() => {
    var server = seneca.export('web/context')()

    server.listen('4050', (err) => {
      console.log(err || 'server started on: 4050')
    })
  })
