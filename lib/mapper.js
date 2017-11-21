'use strict'

var Path = require('path')
var Url = require('url')
var _ = require('lodash')

module.exports = function mapper (routePlan) {
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
        suffix: false,
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

      // Set alias', suffix and redirects.
      route.alias = value.alias || route.alias
      route.redirect = value.redirect || route.redirect
      route.suffix = value.suffix || route.suffix

      // allow user to overwrite the name of the route
      // this can be blank string (which is falsy)
      if (typeof value.name !== 'undefined') { route.part = value.name }

      // Checking specifically for false as true or missing means on.
      if (value.autoreply === false) {
        route.autoreply = false
      }

      // If there are middleware then set it
      if (value.middleware) {
        // middleware can be array or single object
        route.middleware = _.flatten([value.middleware])
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

function buildPath (route) {
  let path = null
  if (route.alias) {
    path = Path.join('/', route.alias)
  }
  else {
    const prefix = route.prefix || ''
    const part = route.part || ''
    const postfix = route.postfix || ''
    const suffix = route.suffix || ''
    path = Path.join('/', prefix, part, postfix, suffix)
  }
  return Url.parse(path).path
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
