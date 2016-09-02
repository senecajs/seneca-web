'use strict'

var Path = require('path')
var _ = require('lodash')

module.exports = function mapRoutes (specs) {
  var routes = []

  _.each(specs, (spec) => {
    var prefix = spec.prefix
    var postfix = spec.postfix
    var pin = spec.pin

    _.mapKeys(spec.map, (map, key) => {
      var route = {
        pattern: pin.replace('cmd:*', `cmd:${key}`),
        prefix: prefix || null,
        postfix: postfix || null,
        part: key || null,
        pin: pin || null,
        alias: null,
        methods: [],
        autoreply: true
      }

      if (!_.isObject(map) && map === true) {
        route.methods.push('GET')
        route.path = buildPath(route)
        routes.push(route)
        return
      }

      route.alias = map.alias || null
      
      if (map.autoreply === false) {
        route.autoreply = false
      }

      _.mapKeys(map, (active, method) => {
        if (method !== 'alias' && method !== 'autoreply') {
          route.methods.push(method)
        }
      })

      route.path = buildPath(route)
      routes.push(route)
    })
  })

  return routes
}

// Path won't work on windows, need non lazy solution
function buildPath (route) {
  if (route.alias) {
    return Path.join(route.alias)
  }

  return Path.join(
    route.prefix || '',
    route.part || '',
    route.postfix || ''
  )
}
