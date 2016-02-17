/* Copyright (c) 2013-2015 Richard Rodger, MIT License */
/* jshint node:true, asi:true, eqnull:true */
'use strict'

var Async = require('async')
var Util = require('util')
var Buffer = require('buffer')

var _ = require('lodash')
var Parambulator = require('parambulator')
var Mstring = require('mstring')
var Nid = require('nid')
var Connect = require('connect')
var ServeStatic = require('serve-static')
var JsonStringifySafe = require('json-stringify-safe')
var Stats = require('rolling-stats')
var Norma = require('norma')

var Error = require('eraro')({
  package: 'seneca',
  msgmap: ERRMSGMAP(),
  override: true
})

var HttpRouter = require('./http-router')
var methodlist = _.clone(HttpRouter.methods)

module.exports = function (options) {
  var internals = {
    // default framework
    framework: 'express'
  }

  /* jshint validthis:true */
  Norma('o', arguments)

  var seneca = this

  options = seneca.util.deepextend({
    // URL prefix for all generated paths
    prefix: '/api/',

    // URL prefix for content provided by this plugin
    contentprefix: '/seneca',

    // Endpoint call statistics, see https://github.com/rjrodger/rolling-stats
    stats: {
      size: 1024,
      duration: 60000
    },

    // Default function builders
    make_defaulthandler: make_defaulthandler,
    make_defaultresponder: make_defaultresponder,
    make_redirectresponder: make_redirectresponder,

    // Log warnings for invalid requests
    warn: {
      req_body: true,
      req_params: true,
      req_query: true
    },

    // Extended debugging
    debug: {
      service: false
    }
  }, options)

  // set framework type in seneca.options to signal to other modules the framework type
  if (!seneca.options().plugin.web) {
    seneca.options().plugin.web = {}
  }
  seneca.options().plugin.web.framework = internals.framework


  var timestats = new Stats.NamedStats(options.stats.size, options.stats.duration)

  // Ordered list of middleware services.
  var services = []

  var configmap = {}
  var servicemap = {}

  seneca.private$._web = {
    routemap: {}
  }
  var route_list_cache = null

  var init_template = _.template(Mstring(
    function () {/***
     ;(function(){
        var w = this
        var seneca = w.seneca || (w.seneca={})
        seneca.config = {}
        <% _.each(configmap,function(data,name){%>
        seneca.config[<%=JSON.stringify(name)%>] = <%=JSON.stringify(data)%>
        <%})%>
      }).call(window);
     ***/
    }))

  var initsrc = init_template({_: _, configmap: configmap})

  var sourcelist = []


  function add_action_patterns () {
    seneca

    // Define a web service API.
      .add('role:web', web_use)

      // List known web services.
      .add('role:web, list:service', list_service)

      // List known routes.
      .add('role:web, list:route', list_route)

      // Provide route performance statistics.
      .add('role:web, stats:true', action_stats)

      // Get client-side configuration.
      .add('role:web, get:config', get_config)

      // Set client-side source code.
      .add('role:web, set:source', set_source)

      // Get client-side source code list.
      .add('role:web, get:sourcelist', get_sourcelist)

      .add('role: web, do: startware', default_startware)

      .add('role: web, get: server', get_server)

      .add('role: web, get: restriction', default_get_restriction)

      .add('role: web, set: framework', set_framework)

      .add('role: web, handle: response', handle_response)
  }


  function default_get_restriction (msg, done) {
    done()
  }

  function default_startware (msg, done) {
    done()
  }

  function get_server (msg, done) {
    done(null, {server: internals.server})
  }

  // Service specification schema.
  var spec_check = Parambulator({
    type$: 'object',
    pin: {required$: true},
    map: {required$: true, object$: true},
    prefix: 'string$',
    startware: 'function$',
    premap: 'function$',

    endware: 'function$',
    postmap: 'function$'
  }, {
    topname: 'spec',
    msgprefix: 'web-use: '
  })

  // Action: _role:web_
  function web_use (args, done) {
    var seneca = this

    // The plugin is defining some client-side configuration.
    if (args.config && args.plugin) {
      configmap[args.plugin] =
        _.extend({}, configmap[args.plugin] || {}, args.config)

      initsrc = init_template({_: _, configmap: configmap})
    }

    if (!args.use) {
      return done()
    }

    // Add service to middleware layers, order is significant
    args.use.plugin$ = args.plugin$
    args.use.serviceid$ = Nid()
    route_list_cache = null

    if (_.isFunction(args.use)) {
      services.push(args.use)
      servicemap[args.use.serviceid$] = args.use
      return done()
    }

    spec_check.validate(args.use, function (err) {
      if (err) {
        return done(err)
      }

      if (seneca.private$._isReady) {
        return wrapper()
      }

      done()
      done = _.noop
      seneca.once('after-pin', wrapper)
    })

    function wrapper () {
      define_service(seneca, args.use, function (err, service) {
        if (err) return done(err)

        if (service) {
          services.push(service)
          servicemap[service.serviceid$] = service
        }

        done()
      })
    }
  }


  web_use.validate = {
    // Use a mapping, or custom middleware function
    use: {},

    // Client-side configuration for named plugin.
    config: {object$: true},

    // Client-side name for the plugin.
    plugin: {string$: true}
  }


  // Action: _role:web, cmd:source_
  function set_source (args, done) {
    sourcelist.push('\n;// ' + args.title + '\n' + args.source)
    done()
  }

  set_source.validate = {
    title: {string$: true},
    source: {required$: true, string$: true}
  }


  // Action _role:web, get:sourcelist_
  function get_sourcelist (args, done) {
    done(null, _.clone(sourcelist))
  }


  // Action _role:web, get:config_
  function get_config (args, done) {
    done(null, _.clone(configmap[args.plugin] || {}))
  }

  get_config.validate = {
    plugin: {required: true, string$: true}
  }


  // Action _role:web, list:service_.
  function list_service (args, done) {
    done(null, _.clone(services))
  }


  // Action _role:web, list:route_.
  function list_route (args, done) {
    if (null == route_list_cache) {
      route_list_cache = []
      var methods = _.keys(seneca.private$._web.routemap)
      _.each(methods, function (method) {
        var urlmap = seneca.private$._web.routemap[method]
        if (urlmap) {
          _.each(urlmap, function (srv, url) {
            route_list_cache.push({
              url: url,
              method: method.toUpperCase(),
              service: srv
            })
          })
        }
      })
      route_list_cache.sort(function (a, b) {
        return a.url === b.url ? 0 : a.url < b.url ? -1 : +1
      })
    }

    done(null, _.clone(route_list_cache))
  }


  // Action _role:web, stats:true_.
  function action_stats (args, done) {
    var stats = {}
    this.act('role:web,list:route', function (err, list) {
      if (err) return done(err)

      _.each(list, function (route) {
        var pluginname = (route.service &&
          route.service.plugin &&
          route.service.plugin.name) || '-'
        var name = pluginname + ';' + route.method + ';' + route.url
        stats[name] = {}
      })

      _.each(timestats.names(), function (name) {
        stats[name] = timestats.calculate(name)
      })

      done(null, stats)
    })
  }


  add_action_patterns()


  // Define service middleware
  function define_service (instance, spec, done) {
    // legacy properties
    spec.postmap = spec.postmap || spec.endware

    spec.prefix = fixprefix(spec.prefix, options.prefix)
    var pin = instance.pin(spec.pin)
    var actmap = make_actmap(pin)
    var routespecs = make_routespecs(actmap, spec, options)

    resolve_actions(instance, routespecs)
    resolve_methods(instance, spec, routespecs, options)
    resolve_dispatch(instance, spec, routespecs, timestats, options)

    var maprouter = make_router(instance, spec, routespecs)
    var service = make_service(instance, spec, maprouter)

    // in case that there is used Hapi
    // then register routes
    if (internals.framework === 'hapi') {
      addHapiRoute(spec, routespecs, function (err) {
        done(err, service)
      })
    }
    else {
      return done(null, service)
    }
  }

  // Add Hapi routes
  function addHapiRoute (spec, routespecs, done) {
    var endpoints_specs = []
    for ( var i in routespecs ) {
      for (var method in routespecs[i].methods) {
        endpoints_specs.push({
          routespecs: routespecs[i],
          method: method,
          spec: spec
        })
      }
    }

    Async.each(endpoints_specs, register_hapi_endpoints, done)
  }

  function register_hapi_endpoints (endpoint_spec, done) {
    var routespecs = endpoint_spec.routespecs
    var method = endpoint_spec.method
    var spec = endpoint_spec.spec

    var pattern = routespecs.pattern
    var path = routespecs.fullurl

    path = changeToHapi(path)

    var data = routespecs.data || false

    var hapi_route = {
      method: method,
      path: path,
      config: {},
      handler: spec.handler || (function () {
        return function (request, reply) {
          if (spec.startware) {
            spec.startware.call(request.seneca, request, function (err) {
              if (err) return reply(err)

              do_maprouter()
            } )
          }
          else {
            do_maprouter()
          }

          function do_maprouter () {
            request.seneca.act('role: web, do: startware', {req: request}, function (err, out) {
              if (err) return reply(err)

              var currentPattern = _.clone(pattern)

              if (request.payload) {
                if (data) {
                  currentPattern.data = request.payload
                }
                else {
                  currentPattern = _.extend({}, request.payload, currentPattern)
                }
              }

              if (request.params) {
                currentPattern = _.extend({}, request.params, currentPattern)
              }
              if (request.query) {
                currentPattern = _.extend({}, request.query, currentPattern)
              }

              request.seneca.act( currentPattern, function (err, result) {
                if (err) {
                  return sendreply(err)
                }

                if ( spec.postmap ) {
                  spec.postmap.call( request.seneca, request, result, function ( err ) {
                    if ( err ) {
                      return sendreply(err)
                    }
                    return sendreply(result)
                  } )
                }
                else {
                  sendreply(result)
                }
              } )
            } )
          }

          function sendreply (result) {
            var http_status = result.http$
            delete result.http$

            // send result
            var repl = reply(result)

            // send cookies
            for (var cookie in request.raw.res.cookies) {
              repl.state(cookie, request.raw.res.cookies[cookie])
            }

            if (http_status) {
              // redirect if necessary
              if (http_status.redirect) {
                repl.redirect(http_status.redirect)
              }
              // change status
              if (http_status.status) {
                repl.statusCode = http_status.status
              }
            }
          }
        }
      }())
    }

    if (routespecs.auth && routespecs.auth !== 'none') {
      hapi_route.config.auth = routespecs.auth
      internals.server.route( hapi_route )
      done()
    }
    else {
      // try to find auth - if is restricted in another plugins - like seneca-auth
      seneca.act('role: web, get: restriction', {path: path}, function (err, restrict) {
        if (err) {
          return done(err)
        }
        if (restrict && restrict.auth) {
          hapi_route.config.auth = restrict.auth
        }

        internals.server.route( hapi_route )
        done()
      })
    }

    function changeToHapi (path) {
      var tokens = path.split('/')

      for (var i in tokens) {
        if (tokens[i].charAt(0) === ':') {
          tokens[i] = '{' + tokens[i].substr(1) + '}'
        }
      }
      return tokens.join('/')
    }
  }


  // Define exported middleware function
  // TODO is connect the best option here?

  var app = Connect()
  app.use(ServeStatic(__dirname + '/web'))

  var use = function (req, res, next) {
    if (0 === req.url.indexOf(options.contentprefix)) {
      if (0 === req.url.indexOf(options.contentprefix + '/init.js')) {
        res.writeHead(200, {'Content-Type': 'text/javascript'})
        return res.end(initsrc + sourcelist.join('\n'))
      }

      req.url = req.url.substring(options.contentprefix.length)
      return app(req, res)
    }
    else return next()
  }


  function next_service (req, res, next, i) {
    if (i < services.length) {
      var service = services[i]

      if (options.debug.service) {
        seneca.log.debug(
          'service-chain', req.seneca.fixedargs.tx$,
          req.method, req.url, service.serviceid$,
          Util.inspect(service.plugin$))
      }

      service.call(req.seneca, req, res, function (err) {
        if (err) return next(err)

        next_service(req, res, next, i + 1)
      })
    }
    else {
      if (next) return next()
    }
  }

  // Switch mode for Hapi integration
  function web_hapi (server, options, next) {
    set_framework({
      server: server,
      options: options,
      framework: 'hapi'
    }, next)
  }

  function set_framework (msg, done) {
    internals.framework = msg.framework
    internals.server = msg.server

    // set framework type in seneca.options to signal to other modules the framework type
    if (!seneca.options().plugin.web) {
      seneca.options().plugin.web = {}
    }
    seneca.options().plugin.web.framework = msg.framework

    done()
  }

  var web = function (req, res, next) {
    res.seneca = req.seneca = seneca.root.delegate({
      req$: req,
      res$: res,
      tx$: seneca.root.idgen()
    })

    next_service(req, res, _error_handler, 0)

    function _error_handler (err, response) {
      req.seneca.act(
        'role: web, handle: response',
        {
          req: req,
          res: res,
          err: err,
          response: response,
          next: next
        },
        function () {
          // nothing to do here
        })
    }
  }

  function handle_response (msg, done) {
    var err = msg.err
    var res = msg.res
    var response = msg.response
    var next = msg.next

    if (err) {
      var redirect = err.http$ && err.http$.redirect
      var status = err.http$ && err.http$.status || 400

      // Send redirect response.
      if (redirect) {
        res.writeHead(status, {
          'Location': redirect
        })
      }
      else {
        delete err.http$
        res.status(status).send(err)
      }
      res.end()
    }
    else {
      next(err, response)
    }
    done()
  }

  seneca.add({init: 'web'}, function (args, done) {
    var seneca = this

    var config = {prefix: options.contentprefix}

    seneca.act({role: 'web', plugin: 'web', config: config, use: use})

    seneca.act({
      role: 'basic', note: true, cmd: 'push', key: 'admin/units', value: {
        unit: 'web-service',
        spec: {
          title: 'Web Services',
          ng: {module: 'senecaWebServiceModule', directive: 'seneca-web-service'}
        },
        content: [{
          type: 'js', file: __dirname + '/web/web-service.js'
        }]
      }
    })

    done()
  })


  return {
    name: 'web',
    export: web,
    exportmap: {
      httprouter: HttpRouter,
      hapi: web_hapi
    }
  }
}

module.exports.preload = function () {
  var seneca = this

  var meta = {
    name: 'web',
    export: function () {
      var args = arguments

      seneca.ready(function () {
        // prevent infinite loop
        if (seneca.export('web') !== meta.export) {
          seneca.export('web').apply(seneca, args)
        }
      })
    },
    exportmap: {
      httprouter: HttpRouter,
      hapi: function (server, options, next) {
        seneca.act({
          role: 'web',
          set: 'framework',
          server: server,
          options: options,
          framework: 'hapi'
        },
        next)
      }
    }
  }

  return meta
}


// ### Route functions

// Default action handler; just calls the action.
function make_defaulthandler (spec, routespec, methodspec) {
  Norma('ooo', arguments)

  return function defaulthandler (req, res, args, act, respond) {
    act(args, function (err, out) {
      respond(err, out)
    })
  }
}


// Default response handler; applies custom http$ settings, if any
function make_defaultresponder (spec, routespec, methodspec) {
  Norma('ooo', arguments)

  return function defaultresponder (req, res, err, obj) {
    obj = (null == obj) ? {} : obj
    var outobj = {}

    if (!_.isObject(obj)) {
      err = Error('result_not_object', {url: req.url, result: obj.toString()})
    }
    else {
      outobj = _.clone(obj)
      // Ensure metadata is cloned when obj is an array.
      _.assign(outobj, _.pick(obj, ['http$', 'redirect$', 'httpstatus$']))
    }

    var http = outobj.http$
    if (http) {
      delete outobj.http$
    }
    else {
      http = {}
    }

    // specific http settings
    http = _.extend({}, spec.http, routespec.http, methodspec.http, http)

    // Legacy settings
    if (outobj.redirect$) {
      http.redirect = outobj.redirect$
      delete outobj.redirect$
    }

    if (outobj.httpstatus$) {
      http.status = outobj.httpstatus$
      delete outobj.httpstatus$
    }

    if (err) {
      var errobj = err.seneca ? err.seneca : err
      http = _.extend({}, http, {redirect: errobj.redirect$, status: errobj.httpstatus$}, errobj.http$ || {})
    }

    // Send redirect response.
    if (http.redirect) {
      res.writeHead(http.status || 302, _.extend({
        'Location': http.redirect
      }, http.headers))
      res.end()
    }

    // Send JSON response.
    else {
      var outjson = err ? JSON.stringify({error: '' + err}) : stringify(outobj)

      http.status = http.status || (err ? 500 : 200)

      res.writeHead(http.status, _.extend({
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=0, no-cache, no-store',
        'Content-Length': Buffer.Buffer.byteLength(outjson)
      }, http.headers))

      res.end(outjson)
    }
  }
}


function make_redirectresponder (spec, routespec, methodspec) {
  Norma('ooo', arguments)

  return function (req, res, err, obj) {
    var url = methodspec.redirect || routespec.redirect

    var status = 302 || methodspec.status || routespec.status

    if (err) {
      url += '?ec=' + encodeURIComponent(err.code ? err.code : err.message)
      status = err.httpstatus$ || (err.http$ && err.http$.status) || status
    }

    res.writeHead(status, {
      'Location': url
    })
    res.end()
  }
}


// ### Spec parsing functions

var defaultflags = {useparams: true, usequery: true, data: false}

function make_routespecs (actmap, spec, options) {
  Norma('ooo', arguments)

  var routespecs = []

  _.each(actmap, function (pattern, fname) {
    var routespec = spec.map.hasOwnProperty(fname) ? spec.map[fname] : null

    // Only build a route if explicitly defined in map
    if (!routespec) return

    var url = spec.prefix + fname

    // METHOD:true abbrev
    routespec = _.isBoolean(routespec) ? {} : routespec

    if (routespec.alias) {
      url = spec.prefix + fixalias(routespec.alias)
    }

    routespec.premap = routespec.premap || spec.premap

    routespec.prefix = spec.prefix
    routespec.suffix = routespec.suffix || ''
    routespec.fullurl = url + routespec.suffix

    routespec.fname = fname
    routespec.pattern = pattern

    _.each(defaultflags, function (val, flag) {
      routespec[flag] = null == routespec[flag] ? val : routespec[flag]
    })

    if (_.isString(routespec.redirect) && !routespec.responder) {
      routespec.responder = make_redirectresponder(spec, routespec, {})
    }

    routespecs.push(_.clone(routespec))
  })

  return routespecs
}


function resolve_actions (instance, routespecs) {
  Norma('oa', arguments)

  _.each(routespecs, function (routespec) {
    var actmeta = instance.findact(routespec.pattern)
    if (!actmeta) return

    var act = function (args, cb) {
      this.act(this, _.extend({}, routespec.pattern, args), cb)
    }

    routespec.act = act
    routespec.actmeta = actmeta
  })
}

function resolve_methods (instance, spec, routespecs, options) {
  Norma('ooao', arguments)

  _.each(routespecs, function (routespec) {
    var methods = {}

    _.each(methodlist, function (method) {
      var methodspec = routespec[method] || routespec[method.toUpperCase()]
      if (!methodspec) return

      var handler = methodspec
      if (_.isFunction(methodspec) || !_.isObject(methodspec)) {
        methodspec = {handler: handler}
      }

      methodspec.method = method

      methods[method] = methodspec
    })

    if (0 === _.keys(methods).length) {
      methods.get = {method: 'get'}
    }

    _.each(methods, function (methodspec) {
      _.each(defaultflags, function (val, flag) {
        methodspec[flag] =
          (null == methodspec[flag]) ? routespec[flag] : methodspec[flag]
      })

      methodspec.handler =
        _.isFunction(methodspec.handler) ? methodspec.handler
          : _.isFunction(routespec.handler) ? routespec.handler
          : options.make_defaulthandler(spec, routespec, methodspec)

      if (_.isString(methodspec.redirect) && !methodspec.responder) {
        methodspec.responder =
          options.make_redirectresponder(spec, routespec, methodspec)
      }

      methodspec.responder =
        _.isFunction(methodspec.responder) ? methodspec.responder
          : _.isFunction(routespec.responder) ? routespec.responder
          : options.make_defaultresponder(spec, routespec, methodspec)

      methodspec.modify =
        _.isFunction(methodspec.modify) ? methodspec.modify
          : _.isFunction(routespec.modify) ? routespec.modify
          : defaultmodify

      methodspec.argparser = make_argparser(instance, options, methodspec)
    })

    routespec.methods = methods
  })
}

function resolve_dispatch (instance, spec, routespecs, timestats, options) {
  Norma('ooaoo', arguments)

  _.each(routespecs, function (routespec) {
    _.each(routespec.methods, function (methodspec, method) {
      methodspec.dispatch = function (req, res, next) {
        if (options.debug.service) {
          instance.log(
            'service-dispatch', req.seneca.fixedargs.tx$,
            req.method, req.url, spec.serviceid$,
            Util.inspect(methodspec))
        }

        var begin = Date.now()
        var args = methodspec.argparser(req)

        var si = req.seneca

        var respond = function (err, obj) {
          var qi = req.url.indexOf('?')
          var url = -1 === qi ? req.url : req.url.substring(0, qi)

          var name = (routespec.actmeta.plugin_fullname || '') +
            ';' + routespec.actmeta.pattern
          timestats.point(Date.now() - begin, name + ';' + req.method + ';' + url)

          var result = {err: err, out: obj}
          methodspec.modify(result)

          methodspec.responder.call(si, req, res, result.err, result.out)
        }

        var act_si = function (args, done) {
          routespec.act.call(si, args, done)
        }

        var premap = routespec.premap || function () {
          arguments[3]()
        }

        // legacy signature
        if (3 === premap.length) {
          var orig_premap = premap
          premap = function (args, req, res, next) {
            orig_premap.call(this, req, res, next)
          }
        }

        premap.call(si, args, req, res, function (err) {
          if (err) return next(err)

          methodspec.handler.call(si, req, res, args, act_si, respond)
        })
      }
    })
  })
}


function make_argparser (instance, options, methodspec) {
  Norma('ooo', arguments)

  return function (req) {
    if (!_.isObject(req.body) && options.warn.req_body) {
      instance.log.warn(
        'seneca-web: req.body not present! ' +
        'Do you need: express_app.use( require("body-parser").json() ?')
    }

    if (methodspec.useparams && options.warn.req_params && !_.isObject(req.params)) {
      instance.log.warn(
        'seneca-web: req.params not present! ' +
        "To access URL params, you'll express or an appropriate parser module.")
    }

    if (methodspec.usequery && options.warn.req_query && !_.isObject(req.query)) {
      instance.log.warn(
        'seneca-web: req.query not present! ' +
        'To access the URL query string, you\'ll need express' +
        'or an appropriate parser module.')
    }

    var data = _.extend(
      {},
      (_.isObject(req.body) && !methodspec.data) ? req.body : {},
      (methodspec.useparams && _.isObject(req.params)) ? req.params : {},
      (methodspec.usequery && _.isObject(req.query)) ? req.query : {}
    )

    // data flag means put body into separate data property
    if (methodspec.data) {
      data.data = _.isObject(req.body) ? req.body : {}
      return data
    }
    else return data
  }
}


function make_router (instance, spec, routespecs) {
  Norma('ooa', arguments)

  var routemap = instance.private$._web.routemap
  var routes = []
  var mr = HttpRouter(function (http) {
    _.each(routespecs, function (routespec) {
      _.each(routespec.methods, function (methodspec, method) {
        instance.log.debug('http', method, routespec.fullurl)
        http[method](routespec.fullurl, methodspec.dispatch)

        var rm = (routemap[method] = (routemap[method] || {}))
        rm[routespec.fullurl] = {
          pattern: routespec.pattern,
          plugin: spec.plugin$,
          serviceid: spec.serviceid$,
          prefix: spec.prefix
        }

        routes.push(method.toUpperCase() + ' ' + routespec.fullurl)
      })
    })
  })

  mr.routes$ = routes

  return mr
}


function make_service (instance, spec, maprouter) {
  var service = function service (req, res, next) {
    var si = req.seneca || instance

    if (spec.startware) {
      spec.startware.call(si, req, res, function (err) {
        if (err) return next(err)

        do_maprouter()
      })
    }
    else {
      do_maprouter()
    }

    function do_maprouter (err) {
      if (err) return next(err)

      maprouter(req, res, function (err) {
        if (err) return next(err)

        if (spec.postmap) {
          spec.postmap.call(si, req, res, function (err) {
            return next(err)
          })
        }
        else return next()
      })
    }
  }

  service.pin$ = spec.pin
  service.plugin$ = spec.plugin$
  service.serviceid$ = spec.serviceid$
  service.routes$ = maprouter.routes$

  return service
}


// ### Utility functions

// Convert an object to a JSON string, handling circular refs.
function stringify (obj, indent, depth, decycler) {
  indent = indent || null
  depth = depth || 0
  decycler = decycler || null
  return JsonStringifySafe(obj, indent, depth, decycler)
}


// Ensure the URL prefix is well-formed.
function fixprefix (prefix, defaultprefix) {
  prefix = null != prefix ? prefix : defaultprefix

  if (!prefix.match(/\/$/)) {
    prefix += '/'
  }

  if (!prefix.match(/^\//)) {
    prefix = '/' + prefix
  }

  return prefix
}


// Ensure alias has no leading slash.
function fixalias (alias) {
  alias = null != alias ? '' + alias : ''

  alias = alias.replace(/^\/+/, '')

  return alias
}


// Map action pin function names to action patterns.
// The function names form part of the URL.
function make_actmap (pin) {
  var actmap = {}

  for (var fn in pin) {
    var f = pin[fn]
    if (_.isFunction(f) && null != f.pattern$) {
      actmap[f.name$] = f.pattern$
    }
  }

  return actmap
}


function defaultmodify (result) {
  // strip out $ properties, apart from http$, which is dealt with later
  var clean = function (item) {
    if (_.isObject(item)) {
      _.each(item, function (v, k) {
        if (~k.indexOf('$') && 'http$' !== k && 'httpstatus$' !== k) {
          delete item[k]
        }
      })
    }
  }

  if (_.isArray(result.out)) {
    _.each(result.out, clean)
  }
  else {
    clean(result.out)
  }
}

function ERRMSGMAP () {
  return {
    result_not_object: 'API result is not an object: <%=url%> returned <%=result%>.'
  }
}
