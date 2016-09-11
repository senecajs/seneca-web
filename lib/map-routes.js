'use strict'

var Path = require('path')
var _ = require('lodash')

module.exports = function mapRoutes (routePlan) {
  var routes = []

  // routePlan can be an array or single object.
  routePlan = _.flatten([routePlan])

  _.each(routePlan, (routeSet) => {
    _.mapKeys(routeSet.map, (value, key) => {
      // We need both a part and pin to have a valid route.
      if (!routeSet.pin || !key) {
        return
      }

      var defaultRoute = {
        prefix: false,
        postfix: false,
        part: false,
        pin: false,
        alias: false,
        methods: [],
        autoreply: true,
        redirect: false,
        auth: false,
        secure: false
      }

      var route = {
        prefix: routeSet.prefix,
        postfix: routeSet.postfix,
        pin: routeSet.pin,
        part: key
      }

      // Minimally viable route.
      route = _.merge({}, defaultRoute, route)

      // allows custom patterns, looks for the * in "role:todo,cmd:*"
      route.pattern = route.pin.replace(':*', `:${key}`)

      // If the value a bool the route is a simple get.
      if (!_.isObject(value)) {
        route.methods.push('GET')
        route.path = buildPath(route)
        routes.push(route)
        return
      }

      // Set alias' and redirects.
      route.alias = value.alias || route.alias
      route.redirect = value.redirect || route.redirect

      // Checking specifically for false as true or missing means on.
      if (value.autoreply === false) {
        route.autoreply = false
      }

      // If there is an auth and strategy, use it.
      if (value.auth && value.auth.strategy) {
        route.auth = value.auth
      }

      // If there is a secure, set it
      if (value.secure) {
        route.secure = value.secure
      }

      _.mapKeys(value, (active, method) => {
        if (isValidMethod(method)) {
          route.methods.push(method)
        }
      })

      // build the route and push to the list
      route.path = buildPath(route)
      routes.push(route)
    })
  })

  return routes
}

// Path won't work on windows, need non lazy solution
function buildPath (route) {
  if (route.alias) {
    return Path.join('/', route.alias)
  }

  const prefix = route.prefix || ''
  const part = route.part || ''
  const postfix = route.postfix || ''

  return Path.join('/', prefix, part, postfix)
}

function isValidMethod (method) {
  method = method || ''
  method = method.toString()
  method = method.toUpperCase()

  const methods = [
    'GET',
    'POST',
    'PUT',
    'HEAD',
    'DELETE',
    'OPTIONS',
    'PATCH'
  ]

  return _.includes(methods, method)
}
