'use strict'

module.exports = function log (context, routes, done) {
  console.log(JSON.stringify({routes: routes}, null, 2))
  done(null, {ok: true, routes: routes})
}