'use strict'

var Path = require('path')
var _ = require('lodash')

module.exports = function mapRoutes (specs, done) {
  var routes = []
  var failed = null

  specs = _.flatten([specs])

  _.each(specs, (spec) => {
    var prefix = spec.prefix
    var postfix = spec.postfix
    var pin = spec.pin


    _.mapKeys(spec.map, (value, key) => {
      var route = {
        prefix: prefix || null,
        postfix: postfix || null,
        part: key,
        pin: pin,
        alias: null,
        methods: [],
        autoreply: true
      }

      if (!route.pin) {
        failed = {ok: false, why: 'missing pin'}
        return
      }

      route.pattern = route.pin.replace(':*', `:${key}`)

      // If the value is not an object but a
      // bool (true) the route is a simple get.
      if (!_.isObject(value)) {
        route.methods.push('GET')
        route.path = buildPath(route)
        routes.push(route)
        return
      }

      // The value is an object at this point
      // so set alias and autoreply opts if any.
      route.alias = value.alias || null
      if (value.autoreply === false) {
        route.autoreply = false
      }

      // Map out methods to flatten them into the route.
      _.mapKeys(value, (active, method) => {
        if (method !== 'alias' && method !== 'autoreply' && active) {
          route.methods.push(method)
        }
      })

      // build the route and push to the list
      route.path = buildPath(route)
      routes.push(route)
    })
  })

  done(failed || {ok: true, routes: routes})
}

// Path won't work on windows, need non lazy solution
function buildPath (route) {
  if (route.alias) {
    return Path.join('/', route.alias)
  }

  return Path.join('/', route.prefix || '', route.part, route.postfix || '')
}
