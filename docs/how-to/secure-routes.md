# Secure routes

How to require authentication for routes. Two route properties control
it: `auth` runs an authentication strategy before the action, and
`secure` requires the request to be authenticated already. The program
is [`docs/examples/secure-routes.js`](../examples/secure-routes.js).

Support depends on the adapter:

| Adapter | `auth` | `secure` |
| ------- | ------ | -------- |
| express | yes: `auth.authenticate(strategy, { failureRedirect, successRedirect })` is added before the handler | yes: redirects to `secure.fail` unless `request.user` is set |
| hapi | partly: `strategy` becomes the route's `config.auth`; `pass` redirects before calling the action; `fail` is not used | no |
| connect, koa2 | no | no |

## 1. Give the plugin an authentication provider (Express)

The `auth` option is handed to the adapter. The Express adapter calls
`auth.authenticate(strategy, options)` and uses the returned function
as middleware, which is the [Passport](https://www.passportjs.org)
API. With Passport:

```js
const Passport = require('passport')
const Session = require('express-session')
const Strategy = require('passport-local').Strategy

Passport.use(new Strategy(function (username, password, done) { ... }))
Passport.serializeUser(function (user, done) { done(null, user.id) })
Passport.deserializeUser(function (id, done) { ... })

const app = Express()
app.use(Express.urlencoded({ extended: true }))
app.use(Session({ secret: 'change me', resave: false, saveUninitialized: false }))
app.use(Passport.initialize())
app.use(Passport.session())

seneca.use(SenecaWeb, {
  adapter: require('seneca-web-adapter-express'),
  context: app,
  routes: routes,
  auth: Passport,
})
```

The runnable example replaces Passport with a twenty line provider of
the same shape, so that it needs no session store:

```js
const auth = {
  authenticate: function (strategy, options) {
    return function (req, res, next) {
      const user = req.headers['x-user']
      if (!user) return res.redirect(options.failureRedirect)
      req.user = { name: user, strategy: strategy }
      if (options.successRedirect) return res.redirect(options.successRedirect)
      next()
    }
  },
}
```

## 2. Mark the routes

```js
const routes = {
  pin: 'role:site,cmd:*',
  map: {
    home: { GET: true, alias: '/' },
    profile: { GET: true, secure: { fail: '/' } },
    login: { POST: true, auth: { strategy: 'header', pass: '/profile', fail: '/' } },
  },
}
```

* `secure: { fail }`: the adapter checks `request.user` before calling
  the action and redirects to `fail` when it is missing. With Passport,
  `request.user` is set by the session middleware for logged in users.
* `auth: { strategy, pass, fail }`: the adapter runs the strategy
  first. `pass` and `fail` become Passport's `successRedirect` and
  `failureRedirect`. When the strategy redirects on success, the action
  is never called, so a `login` route usually needs no action beyond a
  placeholder. `auth` is only applied when it has a `strategy`.

## 3. See it work

Output of the example (the `x-user` header stands in for a session):

```
GET /  -> 200 { page: 'home', user: null }
GET /profile  -> 302 location: /
GET /profile {"x-user":"jack"} -> 200 { page: 'profile', user: { name: 'jack' } }
POST /login  -> 302 location: /
POST /login {"x-user":"jill"} -> 302 location: /profile
closed
```

The authenticated user reaches the action as `msg.args.user` (the
Express adapter copies `request.user`; the Hapi adapter copies
`request.auth.credentials`).

## Hapi

Register the strategy on the server and name it in the route; the Hapi
adapter sets `config.auth` on the route:

```js
await server.register(require('@hapi/basic'))
server.auth.strategy('simple', 'basic', { validate })

const routes = {
  pin: 'role:admin,cmd:*',
  map: {
    profile: { GET: true, auth: { strategy: 'simple' } },
  },
}
```

The Hapi adapter 1.0.2 was written for Hapi 16 (`reply` interface) and
redirects to `auth.pass`, when set, before calling the action.

## Logging out

With Passport and Express, the action for a logout route can call the
request's method: `msg.request$.logout(...)`, then the route's
`redirect` sends the user on.
