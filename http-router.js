/* jshint node:true, asi:true, laxcomma:true */
'use strict'

/*!
 * Connect - router
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var parse = require('url').parse


/**
 * Expose router.
 */

exports = module.exports = routerExport

/**
 * Supported HTTP / WebDAV methods.
 */

var _methods = exports.methods = require('methods')

/**
 * Provides Sinatra and Express-like routing capabilities.
 *
 * Examples:
 *
 *     connect.router(function(app){
 *       app.get('/user/:id', function(req, res, next){
 *         // populates req.params.id
 *       });
 *       app.put('/user/:id', function(req, res, next){
 *         // populates req.params.id
 *       });
 *     })
 *
 * @param {Function} fn
 * @return {Function}
 * @api public
 */

function routerExport (fn) {
  /* jshint validthis:true */
  var self = this
  var methods = {}
  var routes = {}
  var params = {}

  if (!fn) throw new Error('router provider requires a callback function')

  // Generate method functions
  _methods.forEach(function (method) {
    methods[method] = generateMethodFunction(method.toUpperCase())
  })

  // Alias del -> delete
  methods.del = methods.delete

  // Apply callback to all methods
  methods.all = function () {
    var args = arguments
    _methods.forEach(function (name) {
      methods[name].apply(this, args)
    })
    return self
  }

  // Register param callback
  methods.param = function (name, fn) {
    params[name] = fn
  }

  fn.call(this, methods)

  function generateMethodFunction (name) {
    var localRoutes = routes[name] = routes[name] || []
    return function (path, fn) {
      var keys = []
      var middleware = []

      // slice middleware
      if (arguments.length > 2) {
        middleware = Array.prototype.slice.call(arguments, 1, arguments.length)
        fn = middleware.pop()
        middleware = flatten(middleware)
      }

      fn.middleware = middleware

      if (!path) throw new Error(name + ' route requires a path')
      if (!fn) throw new Error(name + ' route ' + path + ' requires a callback')
      var regexp = path instanceof RegExp ? path : normalizePath(path, keys)
      localRoutes.push({
        fn: fn,
        path: regexp,
        keys: keys,
        orig: path,
        method: name
      })
      return self
    }
  }

  function router (req, res, next) {
    var self = this
    var route

    (function pass (i) {
      if ((route = match(req, routes, i))) {
        i = 0
        req.params = route.params
        var keys = route.keys;
        // Param preconditions
        (function param (err) {
          try {
            var key = keys[i++]
            var val = req.params[key]
            var fn = params[key]

            if ('route' === err) {
              pass(req._route_index + 1)
              // Error
            }
            else if (err) {
              next(err)
              // Param has callback
            }
            else if (fn) {
              // Return style
              if (1 === fn.length) {
                req.params[key] = fn(val)
                param()
                // Middleware style
              }
              else {
                fn(req, res, param, val)
              }
              // Finished processing params
            }
            else if (!key) {
              // route middleware
              i = 0;
              (function nextMiddleware (err) {
                var fn = route.middleware[i++]
                if ('route' === err) {
                  pass(req._route_index + 1)
                }
                else if (err) {
                  next(err)
                }
                else if (fn) {
                  fn(req, res, nextMiddleware)
                }
                else {
                  route.call(self, req, res, function (err) {
                    if (err) {
                      next(err)
                    }
                    else {
                      pass(req._route_index + 1)
                    }
                  })
                }
              })()
              // More params
            }
            else {
              param()
            }
          }
          catch (err) {
            next(err)
          }
        })()
      }
      else if ('OPTIONS' === req.method) {
        options(req, res, routes)
      }
      else {
        next()
      }
    })()
  }


  router.remove = function (path, method) {
    var fns = router.lookup(path, method)
    fns.forEach(function (fn) {
      routes[fn.method].splice(fn.index, 1)
    })
  }


  router.lookup = function (path, method, ret) {
    ret = ret || []

    // method specific lookup
    if (method) {
      method = method.toUpperCase()
      if (routes[method]) {
        routes[method].forEach(function (route, i) {
          if (path === route.orig) {
            var fn = route.fn
            fn.regexp = route.path
            fn.keys = route.keys
            fn.path = route.orig
            fn.method = route.method
            fn.index = i
            ret.push(fn)
          }
        })
      }
      // global lookup
    }
    else {
      _methods.forEach(function (method) {
        router.lookup(path, method, ret)
      })
    }

    return ret
  }


  router.match = function (url, method, ret) {
    ret = ret || []
    var i = 0
    var fn
    var req

    // method specific matches
    if (method) {
      method = method.toUpperCase()
      req = {url: url, method: method}
      while ((fn = match(req, routes, i))) {
        i = req._route_index + 1
        ret.push(fn)
      }
      // global matches
    }
    else {
      _methods.forEach(function (method) {
        router.match(url, method, ret)
      })
    }

    return ret
  }


  return router
}

/**
 * Respond to OPTIONS.
 *
 * @param {ServerRequest} req
 * @param {ServerResponse} req
 * @param {Array} routes
 * @api private
 */

function options (req, res, routes) {
  var pathname = parse(req.url).pathname
  var body = optionsFor(pathname, routes).join(',')
  res.writeHead(200, {
    'Content-Length': body.length,
    'Allow': body
  })
  res.end(body)
}

/**
 * Return OPTIONS array for the given `path`, matching `routes`.
 *
 * @param {String} path
 * @param {Array} routes
 * @return {Array}
 * @api private
 */

function optionsFor (path, routes) {
  return _methods.filter(function (method) {
    var arr = routes[method.toUpperCase()]
    for (var i = 0, len = arr.length; i < len; ++i) {
      if (arr[i].path.test(path)) return true
    }
  }).map(function (method) {
    return method.toUpperCase()
  })
}

/**
 * Normalize the given path string,
 * returning a regular expression.
 *
 * An empty array should be passed,
 * which will contain the placeholder
 * key names. For example "/user/:id" will
 * then contain ["id"].
 *
 * @param  {String} path
 * @param  {Array} keys
 * @return {RegExp}
 * @api private
 */

function normalizePath (path, keys) {
  path = path
    .concat('/?')
    .replace(/\/\(/g, '(?:/')
    .replace(/(\/)?(\.)?:([\w$]+)(?:(\(.*?\)))?(\?)?/g, function (_, slash, format, key, capture, optional) {
      keys.push(key)
      slash = slash || ''
      return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || '([^/]+?)') + ')' + (optional || '')
    })
    .replace(/([\/.])/g, '\\$1')
    .replace(/\*/g, '(.+)')
    .replace(/\$/g, '\\$')
  var re = new RegExp('^' + path + '$', 'i')
  return re
}

/**
 * Attempt to match the given request to
 * one of the routes. When successful
 * a route function is returned.
 *
 * @param  {ServerRequest} req
 * @param  {Object} routes
 * @return {Function}
 * @api private
 */

function match (req, routes, i) {
  i = i || 0

  var captures
  var method = req.method

  if ('HEAD' === method) method = 'GET'

  if ((routes = routes[method])) {
    var url = parse(req.url)
    var pathname = url.pathname
    var len


    for (len = routes.length; i < len; ++i) {
      var route = routes[i]
      var fn = route.fn
      var path = route.path
      var keys = (fn.keys = route.keys)

      if ((captures = path.exec(pathname))) {
        fn.method = method
        fn.params = []
        var j
        for (j = 1, len = captures.length; j < len; ++j) {
          var key = keys[j - 1]
          var val = typeof captures[j] === 'string' ? decodeURIComponent(captures[j]) : captures[j]
          if (key) {
            fn.params[key] = val
          }
          else {
            fn.params.push(val)
          }
        }
        req._route_index = i
        return fn
      }
    }
  }
}


function flatten (arr, ret) {
  ret = ret || []
  var len = arr.length

  for (var i = 0; i < len; ++i) {
    if (Array.isArray(arr[i])) {
      exports.flatten(arr[i], ret)
    }
    else {
      ret.push(arr[i])
    }
  }
  return ret
}

