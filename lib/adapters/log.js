'use strict'

var _ = require('lodash')

module.exports = function log (options, context, auth, routes, done) {
  if (_.isFunction(options.sink)) {
    options.sink(routes)
  }
  else {
    console.log(JSON.stringify({routes: routes}, null, 2))
  }

  done(null, {ok: true, routes: routes})
}
