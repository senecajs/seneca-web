/* Copyright (c) 2013-2015 Richard Rodger, MIT License */
/* jshint node:true, asi:true, eqnull:true */
"use strict";

// TODO: deeper unit tests, redirects, http settings

var util   = require('util')
var buffer = require('buffer')


var _                   = require('lodash')
var parambulator        = require('parambulator')
var mstring             = require('mstring')
var nid                 = require('nid')
var connect             = require('connect')
var serve_static        = require('serve-static')
var json_stringify_safe = require('json-stringify-safe')
var stats               = require('rolling-stats')
var error               = require('eraro')({package:'seneca',msgmap:ERRMSGMAP()})

var httprouter = require('./http-router')
var methodlist = _.clone(httprouter.methods)



module.exports = function( options ) {
  /* jshint validthis:true */

  var seneca = this

  options = seneca.util.deepextend({
    prefix: '/api/',
    contentprefix: '/seneca',
    stats: {
      size:     1024,
      duration: 60000,
    },
    make_defaulthandler:    make_defaulthandler,
    make_defaultresponder:  make_defaultresponder,
    make_redirectresponder: make_redirectresponder,
  },options)
  
  var timestats = new stats.NamedStats( options.stats.size, options.stats.duration )

  // Ordered list of middleware services.
  var services = []

  var configmap  = {}
  var servicemap = {}

  var routemap = {}
  var route_list_cache = null

  var init_template = _.template(mstring(
    function(){/***
      ;(function(){
        var w = this
        var seneca = w.seneca || (w.seneca={})
        seneca.config = {}
        <% _.each(configmap,function(data,name){%>
        seneca.config[<%=JSON.stringify(name)%>] = <%=JSON.stringify(data)%>
        <%})%>
      }).call(window);
      ***/}))

  var initsrc = init_template({_:_,configmap:configmap})

  var sourcelist = []


  function add_action_patterns() {
    seneca
    // Define a web service API.
      .add( 'role:web', web_use)

    // List known web services.
      .add( 'role:web, list:service', list_service)

    // List known routes.
      .add( 'role:web, list:route', list_route)

    // Provide route performance statistics.
      .add( 'role:web, stats:true', action_stats)

    // Get client-side configuration.
      .add( 'role:web, get:config', get_config)

    // Set client-side source code.
      .add( 'role:web, set:source', set_source)

    // Get client-side source code list.
      .add( 'role:web, get:sourcelist', get_sourcelist)
  }


  // Action: _role:web_
  function web_use( args, done ) {
    var seneca = this

    // The plugin is defining some client-side configuration.
    if( args.config && args.plugin ) {
      configmap[args.plugin] = 
        _.extend( {}, configmap[args.plugin]||{}, args.config )

      initsrc = init_template({_:_,configmap:configmap})
    }
    

    if( args.use ) {
      // Add service to middleware layers, order is significant
      args.use.plugin$    = args.plugin$
      args.use.serviceid$ = nid()
      route_list_cache    = null

      define_service(seneca,args.use,function(err,service){
        if( err ) return done(err);

        if( service ) {
          services.push( service )
          servicemap[service.serviceid$] = service
        }

        done();
      })
    }
    else done();
  }


  web_use.validate = {
    // Use a mapping, or custom middleware function
    use: {},

    // Client-side configuration for named plugin.
    config: {object$:true},
    
    // Client-side name for the plugin.
    plugin: {string$:true},
  } 



  // Action: _role:web, cmd:source_
  function set_source( args, done ) {
    sourcelist.push('\n;// '+args.title+'\n'+args.source)
    done()
  }

  set_source.validate = {
    title:  { string$:true },
    source: { required$:true, string$:true },
  }


  // Action _role:web, get:sourcelist_
  function get_sourcelist( args, done ) {
    done( null, _.clone(sourcelist) )
  }


  // Action _role:web, get:config_
  function get_config( args, done ) {
    done( null, _.clone(configmap[args.plugin] || {}) )
  }

  get_config.validate = {
    plugin: { required:true, string$:true },
  }



  // Action _role:web, list:service_.
  function list_service( args, done ) {
    done( null, _.clone(services) )
  }


  // Action _role:web, list:route_.
  function list_route( args, done ) {
    if( null == route_list_cache ) {
      route_list_cache = []
      var methods = _.keys(routemap)
      _.each(methods,function(method){
        var urlmap = routemap[method]
        if( urlmap ) {
          _.each( urlmap, function(srv,url) {
            route_list_cache.push({
              url:     url,
              method:  method.toUpperCase(),
              service: srv
            })
          })
        }
      })
      route_list_cache.sort(function(a,b){
        return a.url == b.url ? 0 : a.url < b.url ? -1 : +1 
      })
    }

    done( null, _.clone(route_list_cache) )
  }


  // Action _role:web, stats:true_.
  function action_stats(args,done) {
    var stats = {}
    this.act('role:web,list:route',function(err,list){
      if( err ) return done(err);

      _.each(list, function(route){
        var pluginname = (route.service && 
                          route.service.plugin && 
                          route.service.plugin.name) || '-'
        var name = pluginname+';'+route.method+';'+route.url
        stats[name] = {}
      })

      _.each( timestats.names(), function(name) {
        stats[name] = timestats.calculate(name)
      })

      done(null,stats)
    })
  }


  add_action_patterns()


  // Service specification schema.
  var spec_check = parambulator({
    type$:     'object',
    pin:       {required$:true},
    map:       {required$:true,object$:true},
    prefix:    'string$',
    startware: 'function$',
    endware:   'function$',
    premap:    'function$',
    postmap:   'function$',
  }, {
    topname:'spec',
    msgprefix:'web-use: ',
  })



  // Define service middleware
  function define_service( instance, spec, done ) {
    if( _.isFunction( spec ) ) return done( null, spec );

    spec_check.validate(spec,function(err){
      if( err ) return done(err)

      spec.prefix    = fixprefix( spec.prefix, options.prefix )
      var pin        = instance.pin( spec.pin )
      var actmap     = make_actmap( pin )
      var routespecs = make_routespecs( actmap, spec, options )
      
      resolve_actions( instance, routespecs )
      resolve_methods( options, spec, routespecs )
      resolve_dispatch( routespecs, timestats )

      //console.log( util.inspect(routespecs,{depth:null}) )

      var maprouter = make_router( instance, spec, routespecs, routemap )

      var service = function(req,res,next) {
        var si = req.seneca || instance

        if( spec.startware ) {
          spec.startware.call(si,req,res,do_maprouter)
        }
        else do_maprouter();

        function do_maprouter() {
          maprouter(req,res,function(err){
            if(err ) return next(err);

            if( spec.endware ) {
              spec.endware.call(si,req,res,function(err){
                if(err ) return next(err);
                next();
              })
            }
            else next()
          })
        }
      }

      service.pin$       = spec.pin
      service.plugin$    = spec.plugin$
      service.serviceid$ = spec.serviceid$
      service.routes$    = maprouter.routes$

      return done(null,service)
    })
  }




  // TODO connect is a very heavyweight way to do this!!!
  
  var app = connect()
  app.use(serve_static(__dirname+'/web'))

  var use = function(req,res,next){
    if( 0 === req.url.indexOf(options.contentprefix) ) {
      if( 0 === req.url.indexOf(options.contentprefix+'/init.js') ) {
        res.writeHead(200,{'Content-Type':'text/javascript'})
        return res.end(initsrc+sourcelist.join('\n'));
      }
   
      req.url = req.url.substring(options.contentprefix.length)
      return app( req, res );
    }
    else return next();
  }


  
  function next_service(req,res,next,i) {
    if( i < services.length ) {
      var service = services[i]

      // TODO need some sort of logging here to trace failures to call next()

      service.call(req.seneca,req,res,function(err){
        if( err ) return next(err);

        next_service(req,res,next,i+1)
      })
    }
    else {
      if( next ) return next();
    }
  }


  var web = function( req, res, next ) {
    res.seneca = req.seneca = seneca.delegate({req$:req,res$:res})

    next_service(req,res,next,0)
  }


  seneca.add({init:'web'},function(args,done) {
    var seneca = this

    var config = {prefix:options.contentprefix}

    seneca.act({role:'web', plugin:'web', config:config, use:use})

    seneca.act({role:'util',note:true,cmd:'push',key:'admin/units',value:{
      unit:'web-service',
      spec:{
        title:'Web Services',
        ng:{module:'senecaWebServiceModule',directive:'seneca-web-service'}
      },
      content:[
        {type:'js',file:__dirname+'/web/web-service.js'},
      ]
    }})

    done()
  })


  return {
    name: 'web',
    export: web,
    exportmap: {
      httprouter:httprouter
    }
  }
}


// ### Route functions

// Default action handler; just calls the action.
function make_defaulthandler( spec, routespec, methodspec ) {
  return function defaulthandler(req,res,args,act,respond) {
    act(args,respond)
  }
}


// Default response handler; applies custom http$ settings, if any
function make_defaultresponder( spec, routespec, methodspec ) {
  return function defaultresponder(req,res,err,obj) {
    obj = (null == obj) ? {} : obj
    var outobj = {}

    if( !_.isObject( obj ) ) {
      err = error('result_not_object',{url:req.url,result:obj.toString()})
    }
    else {
      outobj = _.clone( obj )
    }

    var http = outobj.http$
    if( http ) {
      delete outobj.http$
    }
    else {
      http = {}
    }
    
    // specific http settings
    http = _.extend({},spec.http,routespec.http,methodspec.http,http)

    // Legacy settings
    if( outobj.redirect$ ) {
      http.redirect = outobj.redirect$
      delete outobj.redirect$
    }

    if( outobj.httpstatus$ ) {
      http.status = outobj.httpstatus$
      delete outobj.httpstatus$
    }

    if( err ) {
      var errobj = err.seneca ? err.seneca : err
      http.redirect = errobj.redirect$   || http.redirect
      http.status   = errobj.httpstatus$ || http.status
    }

    
    // Send redirect response.
    if( http.redirect ) {
      res.writeHead( http.status || 302, _.extend({
        'Location': redirect
      },http.headers))
      res.end()
    }

    // Send JSON response.
    else {
      var outjson = err ? JSON.stringify({error:''+err}) : stringify(outobj)

      http.status = http.status || ( err ? 500 : 200 )

      res.writeHead(http.status,_.extend({
        'Content-Type':  'application/json',
        'Cache-Control': 'private, max-age=0, no-cache, no-store',
        "Content-Length": buffer.Buffer.byteLength(outjson) 
      },http.headers))

      res.end( outjson )
    }
  }
}


function make_redirectresponder( spec, routespec, methodspec ) {
  return function(req,res,err,obj) {
    var url = methodspec.redirect || routespec.redirect
  
    var status = 302 || methodspec.status || routespec.status

    if( err ) {
      url += '?ec='+encodeURIComponent(err.code?err.code:err.message)
      status = err.httpstatus$ || (err.http$ && err.http$.status) || status
    }

    res.writeHead( status, {
      'Location': url
    })
    res.end()
  }
}




// ### Spec parsing functions

var defaultflags = {useparams:true,usequery:true,dataprop:false}

function make_routespecs( actmap, spec, options ) {
  var routespecs = []

  _.each( actmap, function(pattern,fname) {
    var routespec = spec.map.hasOwnProperty(fname) ? spec.map[fname] : null

    // Only build a route if explicitly defined in map
    if( !routespec ) return;
  
    var url = spec.prefix + fname
  
    // METHOD:true abbrev
    routespec = _.isBoolean(routespec) ? {} : routespec
  
    if( routespec.alias ) {
      url = spec.prefix + routespec.alias
    }

    routespec.prefix  = spec.prefix
    routespec.suffix  = routespec.suffix || ''
    routespec.fullurl = url + routespec.suffix

    routespec.fname = fname
    routespec.pattern = pattern

    _.each(defaultflags, function(val,flag) {
      routespec[flag] = null == routespec[flag] ? val : routespec[flag]
    })

    if( _.isString(routespec.redirect) && !routespec.responder) {
      routespec.responder = make_redirectresponder( spec, routespec, {} )
    }
  
    routespecs.push( _.clone(routespec) )
  })

  return routespecs
}


function resolve_actions( instance, routespecs ) {
  _.each( routespecs, function( routespec ) {
    var actmeta = instance.findact( routespec.pattern )
    if( !actmeta ) return;

    var act = function(args,cb) {
      this.act.call(this,_.extend({},routespec.pattern,args),cb)
    }

    routespec.act     = act
    routespec.actmeta = actmeta
  })
}


function resolve_methods( options, spec, routespecs ) {
  _.each( routespecs, function( routespec ) {

    var methods = {}

    _.each( methodlist, function(method) {
      var methodspec = routespec[method] || routespec[method.toUpperCase()]
      if( !methodspec ) return;

      var handler = methodspec
      if( _.isFunction( methodspec ) || !_.isObject( methodspec ) ) {
        methodspec = { handler:handler }
      }
      
      methodspec.method = method

      methods[method] = methodspec
    })

    if( 0 == _.keys(methods).length ) {
      methods.get = { method:'get' }
    }


    _.each( methods, function( methodspec) {

      _.each(defaultflags, function(val,flag) {
        methodspec[flag] = 
          (null == methodspec[flag]) ? routespec[flag] : methodspec[flag]
      })

      methodspec.handler = 
        _.isFunction( methodspec.handler ) ? methodspec.handler : 
        _.isFunction( routespec.handler ) ? routespec.handler : 
        options.make_defaulthandler( spec, routespec, methodspec )


      if( _.isString(methodspec.redirect) && !methodspec.responder) {
        methodspec.responder = 
          options.make_redirectresponder( routespec, methodspec )
      }

      methodspec.responder = 
        _.isFunction( methodspec.responder ) ? methodspec.responder : 
        _.isFunction( routespec.responder ) ? routespec.responder : 
        options.make_defaultresponder( spec, routespec, methodspec )

      methodspec.modify = 
        _.isFunction( methodspec.modify ) ? methodspec.modify : 
        _.isFunction( routespec.modify ) ? routespec.modify : 
        defaultmodify


      methodspec.argparser = make_argparser( methodspec )
    })

    routespec.methods = methods
  })
}


function make_argparser( methodspec ) {
  return function( req ) {

    var args = _.extend(
      {},
      ( methodspec.useparams && _.isObject(req.params) ) ? req.params: {},
      ( methodspec.usequery &&  _.isObject(req.query)  ) ? req.query : {}
    )

    // data flag means put JSON body into separate data field
    // otherwise mix it all in
    var data = _.isObject(req.body)?req.body:{}
    if( methodspec.dataprop ) {
      args.data = data
    }
    else {
      args = _.extend(data,args)
    }

    return args
  }
}


function resolve_dispatch( routespecs, timestats ) {
  _.each( routespecs, function( routespec ) {
    _.each( routespec.methods, function( methodspec, method ) {

      methodspec.dispatch = function( req, res, next ) {
        var begin = Date.now()
        var args  = methodspec.argparser(req)

        var si = req.seneca

        var respond = function(err,obj){
          var qi = req.url.indexOf('?')
          var url = -1 == qi ? req.url : req.url.substring(0,qi)

          var name = (routespec.actmeta.plugin_fullname || '')+
                ';'+routespec.actmeta.pattern
          timestats.point( Date.now()-begin, name+';'+req.method+';'+url );

          methodspec.modify(obj)

          methodspec.responder.call(si,req,res,err,obj)
        }

        var act_si = function(args,done){
          routespec.act.call(si,args,done)
        }

        var premap = routespec.premap || function(){arguments[2]()}

        premap.call(si,req,res,function(err){
          if(err ) return next(err);
          methodspec.handler.call( si, req, res, args, act_si, respond)
        })
      }
    })
  })      
}


function make_router(instance,spec,routespecs,routemap) {
  var routes = []
  var mr = httprouter(function(http){
    _.each( routespecs, function( routespec ) {
      _.each( routespec.methods, function( methodspec, method ) {

        instance.log.debug('http',method,routespec.fullurl)
        http[method](routespec.fullurl, methodspec.dispatch)

        var rm = (routemap[method] = (routemap[method]||{}))
        rm[routespec.fullurl] = {
          pattern:   routespec.pattern,
          plugin:    spec.plugin$,
          serviceid: spec.serviceid$,
          prefix:    spec.prefix
        }

        routes.push( method.toUpperCase()+' '+routespec.fullurl )
      })
    })      
  })

  mr.routes$ = routes

  return mr;
}


// ### Utility functions

// Convert an object to a JSON string, handling circular refs.
function stringify(obj,indent,depth,decycler) {
  indent = indent || null
  depth  = depth || 0
  decycler = decycler || null
  return json_stringify_safe(obj,indent,depth,decycler)
}


// Ensure the URL prefix is well-formed.
function fixprefix( prefix, defaultprefix ) {
  prefix = null != prefix ? prefix : defaultprefix

  if( !prefix.match(/\/$/) ) {
    prefix += '/'
  }

  if( !prefix.match(/^\//) ) {
    prefix = '/'+prefix
  }

  return prefix
}


// Map action pin function names to action patterns.
// The function names form part of the URL.
function make_actmap( pin ) {
  var actmap = {}

  for( var fn in pin ) {
    var f = pin[fn]
    if( _.isFunction(f) && null != f.pattern$ ) {
      actmap[f.name$] = f.pattern$
    }
  }

  return actmap
}



function defaultmodify( obj ) {
  _.keys(obj,function(k){
    if(~k.indexOf('$')){
      delete obj[k]
    }
  })
}

function ERRMSGMAP() {
  return {
    result_not_object: 'API result is not an object: <%=url%> returned <%=result%>.',
  }
}
