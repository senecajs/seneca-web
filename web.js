/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var util   = require('util')
var buffer = require('buffer')


var _                   = require('underscore')
var parambulator        = require('parambulator')
var mstring             = require('mstring')
var nid                 = require('nid')
var connect             = require('connect')
var json_stringify_safe = require('json-stringify-safe')
var stats               = require('rolling-stats')


var httprouter = require('./http-router')


module.exports = function( options ) {
  var seneca = this
  var plugin = 'web'


  options = seneca.util.deepextend({
    prefix:'/api/',
    contentprefix:'/seneca',
    stats: {
      size:1024,
      duration:60000,
    },
  },options)
  

  //options.contentprefix = seneca.util.pathnorm( options.contentprefix )


  var timestats = new stats.NamedStats( options.stats.size, options.stats.duration )

  var services = []

  var configmap  = {}
  var routemap   = {}
  var servicemap = {}


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



  // ### Define action patterns

  seneca.add({
    role:plugin,
    
    config: {object$:true},
    plugin: {string$:true},
  }, web_use)


  seneca.add({
    role: plugin,
    cmd:  'config',

    plugin: {string$:true},
  }, cmd_config)


  seneca.add({
    role: plugin,
    cmd:  'list',
  }, cmd_list)


  seneca.add({
    role: plugin,
    cmd:  'routes',
  }, cmd_routes)


  seneca.add({
    role:  plugin,
    stats: true
  }, action_stats)



  // Define service.  
  // Pattern: _role:web, use:..._
  function web_use( args, done ) {
    var seneca = this

    // The plugin is defining some web client configuration.
    if( args.config && args.plugin ) {
      configmap[args.plugin] = _.extend( {}, configmap[args.plugin]||{}, args.config )
      initsrc = init_template({_:_,configmap:configmap})
    }
    

    if( args.use ) {
      // Add service to middleware layers, order is significant
      args.use.plugin$        = args.plugin$
      args.use.serviceid$     = nid()
      var service = _.isFunction( args.use ) ? args.use : define_service(seneca,args.use)

      services.push( service )
      servicemap[service.serviceid$] = service
    }

    done()
  }



  // Define plugin web configuration.  
  // Pattern _role:web, cmd:config_
  function cmd_config( args, done ) {
    done( null, _.extend({}, null!=args.plugin ? (configmap[args.plugin]||{}) : {} ) )
  }



  // List services.  
  // Pattern: _role:web, cmd:list pattern_
  function cmd_list( args, done ) {
    done( null, _.clone(services) )
  }


  // List routes.  
  // Pattern: _role:web, cmd:routes pattern_
  function cmd_routes( args, done ) {
    var routes = []
    var methods = _.keys(routemap)
    _.each(methods,function(method){
      var urlmap = routemap[method]
      if( urlmap ) {
        _.each( urlmap, function(srv,url) {
          routes.push({url:url,method:method.toUpperCase(),service:srv})
        })
      }
    })

    routes.sort(function(a,b){return a.url == b.url ? 0 : a.url < b.url ? -1 : +1 })
    done( null, routes )
  }



  function action_stats(args,done) {
    var stats = {}
    this.act('role:web,cmd:routes',function(err,list){
      if( err ) return done(err);

      _.each(list, function(route){
        var pluginname = (route.service && route.service.plugin && route.service.plugin.name) || '-'
        var name = pluginname+';'+route.method+';'+route.url
        stats[name] = {}
      })

      _.each( timestats.names(), function(name) {
        stats[name] = timestats.calculate(name)
      })

      done(null,stats)
    })
  }





  // Service specification schema
  var spec_check = parambulator({
    type$: 'object',
    pin:    {required$:true,object$:true},
    map:    {required$:true,object$:true},
    prefix: 'string$'
  }, {
    topname:'spec',
    msgprefix:'http(spec): ',
    callbackmaker:paramerr('seneca/http_invalid_spec')
  })


  // Define service middleware
  function define_service( instance, spec ) {
    spec_check.validate(spec)

    var prefix    = fixprefix( spec.prefix, options.prefix )
    var actmap    = makeactmap( instance, spec.pin )
    var maprouter = makemaprouter(instance,spec,prefix,actmap,routemap,{plugin:spec.plugin$,serviceid:spec.serviceid$},timestats)
    

    // startware and endware always called, regardless of prefix

    var service = function(req,res,next) {
      var si = req.seneca || instance

      if( spec.startware ) {
        //var begin_startware = Date.now()
        spec.startware.call(si,req,res,do_maprouter)
      }
      else do_maprouter();

      function do_maprouter() {
        //if( begin_startware ) timestats.point( Date.now()-begin_startware, spec.plugin$+';startware;'+req.method+';'+req.url );

        maprouter(req,res,function(err){
          if(err ) return next(err);

          if( spec.endware ) {
            var begin_endware = Date.now()
            spec.endware.call(si,req,res,function(err){
              //timestats.point( Date.now()-begin_startware, spec.plugin$+';endware;'+req.method+';'+req.url );
              if(err ) return next(err);
              next();
            })
          }
          else next()
        })
      }
    }

    service.plugin$    = spec.plugin$
    service.serviceid$ = spec.serviceid$

    return service
  }





  var app = connect()
  app.use(connect.static(__dirname+'/web'))

  var use = function(req,res,next){
    if( 0===req.url.indexOf(options.contentprefix) ) {
      if( 0 == req.url.indexOf(options.contentprefix+'/init.js') ) {
        res.writeHead(200,{'Content-Type':'text/javascript'})
        return res.end(initsrc);
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



  seneca.add({init:plugin},function(args,done) {
    var seneca = this

    var config = {prefix:options.contentprefix}

    seneca.act({role:plugin, plugin:plugin, config:config, use:use})

    seneca.act({role:'util',note:true,cmd:'push',key:'admin/units',value:{
      unit:'web-service',
      spec:{title:'Web Services',ng:{module:'senecaWebServiceModule',directive:'seneca-web-service'}},
      content:[
        {type:'js',file:__dirname+'/web/web-service.js'},
      ]
    }})

    done()
  })


  return {
    name: plugin,
    export:web,
    exportmap: {
      httprouter:httprouter
    }
  }
}



// ### Utility functions

function paramerr(code){
  return function(cb){
    return function(err){ 
      if(err){
        throw seneca.fail(code,{msg:err.message})
      }
      else if( cb ) { 
        return cb();
      }
    }
  }
}


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
function makeactmap( instance, pin ) {
  var actmap = {}
  var pin = instance.pin(pin)

  for( var fn in pin ) {
    var f = pin[fn]
    if( _.isFunction(f) && null != f.pattern$ ) {
      actmap[f.name$] = f.pattern$
    }
  }

  return actmap
}


// Default action handler; just calls the action.
function defaulthandler(req,res,args,act,respond) {
  act(args,respond)
}



// Create URL spec for each action from pin
function makeurlspec( spec, prefix, fname ) {
  var urlspec = spec.map.hasOwnProperty(fname) ? spec.map[fname] : null
  if( !urlspec ) return;
  
  var url = prefix + fname
  
  // METHOD:true abbrev
  urlspec = _.isBoolean(urlspec) ? {} : urlspec
  
  if( urlspec.alias ) {
    url = prefix + urlspec.alias
  }

  urlspec.prefix  = prefix
  urlspec.suffix  = urlspec.suffix || ''
  urlspec.fullurl = url + urlspec.suffix

  return urlspec;
}



// Create route for url over method with handler
function route_method(instance,http,method,fullurl,dispatch,routemap,servicedesc,actpat) {
  instance.log.debug('http',method,fullurl)
  http[method](fullurl, dispatch)

  var rm = (routemap[method] = (routemap[method]||{}))
  rm[fullurl] = _.extend({},servicedesc,{pattern:actpat})
}



function make_prepostmap( spec, prefix, http ) {

  // FIX: premap may get called twice if map function calls next

  // lastly, try premap by itself against prefix if nothing else matches
  // needed for common auth checks etc
  // ensures premap is always called
  if( spec.premap ) {
    http.all(prefix, function(req,res,next){
      var si = req.seneca || instance
      spec.premap.call(si,req,res,next)
    })
      }
  
  // FIX: should always be called if premap was called?
  
  if( spec.postmap ) {
    http.all(prefix, function(req,res,next){
      var si = req.seneca || instance
      spec.postmap.call(si,req,res,next)
    })
  }
}




function defaultresponder(req,res,handlerspec,err,obj) {
  var outobj;

  if( _.isObject(obj) ) {
    outobj = _.clone(obj)

    // TODO: test filtering

    var remove_dollar = false
    if( !_.isUndefined(handlerspec.filter) ) {
      if( _.isFunction( handlerspec.filter ) ) {
        outobj = handlerspec.filter(outobj)
      }
      else if( _.isArray( handlerspec.filter ) ) {
        _.each(handlerspec.filter,function(p){
          delete outobj[p]
          remove_dollar = remove_dollar || '$'==p
        })
      }
    }

    // default filter
    // removes $ from entity objects
    else {
      remove_dollar = true
    }

    if( remove_dollar ) {
      _.keys(outobj,function(k){
        if(~k.indexOf('$')){
          delete outobj[k]
        }
      })
    }
  }
  else if( _.isUndefined(obj) ) {
    outobj = ''
  }
  else {
    outobj = obj;
  }

  if( null != outobj.redirect$ ) {
    delete outobj.redirect$
  }

  if( null != outobj.httpstatus$ ) {
    delete outobj.httpstatus$
  }


  var objstr = err ? JSON.stringify({error:''+err}) : stringify(outobj)
  var code   = err ? (err.seneca && err.seneca.httpstatus ?  err.seneca.httpstatus : 500) : (obj && obj.httpstatus$) ? obj.httpstatus$ : 200;

  var redirect = (obj ? obj.redirect$ : false) || 
        (err && err.senecca && err.seneca.httpredirect)

  
  if( redirect ) {
    res.writeHead(code,{
      'Location': redirect
    })
  }
  else {
    res.writeHead(code,{
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=0, no-cache, no-store',
      "Content-Length": buffer.Buffer.byteLength(objstr) 
    })
    res.end( objstr )
  }
}



// TODO: use options to control where args come from

function makehttpargs(spec,urlspec,req) {
  var args = _.extend(
    {},
    _.isObject(req.params)?req.params:{},
    _.isObject(req.query)?req.query:{}
  )

  // data flag means put JSON body into separate data field
  // otherwise mix it all in
  var data = _.isObject(req.body)?req.body:{}
  if( urlspec.data ) {
    args.data = data
  }
  else {
    args = _.extend(data,args)
  }

  // modify args
  for( var argname in spec.args) {
    args[argname] = spec.args[argname](args[argname])
  }

  return args
}


function makedispatch(act,spec,urlspec,handlerspec,timestats) {
  return function( req, res, next ) {
    var begin = Date.now()
    var args = makehttpargs(spec,urlspec,req)


    if( handlerspec.redirect && 'application/x-www-form-urlencoded' == req.headers['content-type']) {

      handlerspec.responder = function(req,res,handlerspec,err,obj) {
        // TODO: put obj into engagement if present
        var url = handlerspec.redirect
        if( err ) {
          url+='?ec='+(err.seneca?err.seneca.code:err.message)
        }
        res.writeHead(302,{
          'Location': url
        })
        res.end()
      }
    }

    var handler   = handlerspec.handler   || defaulthandler
    var responder = handlerspec.responder || defaultresponder

    
    var si = req.seneca || instance
    var respond = function(err,obj){
      var qi = req.url.indexOf('?')
      var url = -1 == qi ? req.url : req.url.substring(0,qi)
      var name = (spec.plugin$ && spec.plugin$.name) || '-'
      timestats.point( Date.now()-begin, name+';'+req.method+';'+url );

      responder.call(si,req,res,handlerspec,err,obj)
    }
    

    var act_si = function(args,done){
      act.call(si,args,done)
    }

    var premap = spec.premap || function(){arguments[2]()}

    premap.call(si,req,res,function(err){
      if(err ) return next(err);
      handler.call( si, req, res, args, act_si, respond, handlerspec)
    })
  }
}




function makemaprouter(instance,spec,prefix,actmap,routemap,servicedesc,timestats) {
  return httprouter(function(http){
    _.each( actmap, function(actpat,fname) {

      var actmeta = instance.findact(actpat)
      if( !actmeta ) return;

      var act = function(args,cb) {
        this.act.call(this,_.extend({},actpat,args),cb)
      }


      var urlspec = makeurlspec( spec, prefix, fname )
      if( !urlspec ) return;



      var mC = 0

      _.each( httprouter.methods, function(method) {
        var handler = urlspec[method] || urlspec[method.toUpperCase()]

        var handlerspec = _.isObject(handler) ? handler : {}
        handlerspec.handler = handlerspec.handler || (_.isFunction(handler) ? handler : defaulthandler)

        var dispatch = makedispatch(act,spec,urlspec,handlerspec,timestats)

        if( handler ) {
          route_method(instance,http,method,urlspec.fullurl,dispatch,routemap,servicedesc,actpat)
          mC++
        }
      })

      if( 0 === mC ) {
        var dispatch = makedispatch(act,spec,urlspec,{},timestats)
        route_method(instance,http,'get',urlspec.fullurl,dispatch,routemap,servicedesc,actpat)
      }
    })


    make_prepostmap( spec, prefix, http )
  })
}
