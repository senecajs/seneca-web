/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var util   = require('util')
var buffer = require('buffer')


var _            = require('underscore')
var parambulator = require('parambulator')
var mstring      = require('mstring')

var connect = require('connect')

var httprouter = require('./http-router')


module.exports = function( options ) {
  var seneca = this
  var plugin = 'web'

  var senutil = seneca.export('util')

  //seneca.depends(plugin,[])


  options = senutil.deepextend({
    prefix:'/seneca',
  },options)
  

  options.prefix = senutil.pathnorm( options.prefix )


  var services = []

  var configmap = {}


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

  seneca.add({role:'web'}, web_use)
  seneca.add({role:'web',cmd:'config'}, cmd_config)



  function web_use( args, done ) {
    var seneca = this

    if( _.isObject(args.config) ) {
      if( !_.isString(args.plugin) ) return seneca.fail({code:'plugin arg required',args:args},done)

      configmap[args.plugin] = _.extend( {}, configmap[args.plugin]||{}, args.config )
    }
    

    initsrc = init_template({_:_,configmap:configmap})

    if( _.isFunction( args.use ) ) {
      services.push(args.use)
    }
    else if( _.isObject( args.use ) ) {
      services.push( define_service(seneca,args.use) )
    }
    done()
  }



  function cmd_config( args, done ) {
    var out
    if( args.plugin ) {
      out = _.extend({},configmap[args.plugin]||{})
    }
    else {
      out = _.extend({},configmap)
    }
    done(null,out)
  }



  function paramerr(code){
    return function(cb){
      return function(err){ 
        if(err){
          throw seneca.fail({code:code,msg:err.message})
        }
        else if( cb ) { 
          return cb();
        }
      }
    }
  }


  function safe_json_stringify(obj,depth) {
    depth = depth || 0
    var jsonstr = ''
    try {
      jsonstr = JSON.stringify(obj)
    }
    catch( e ) {
      if( 0<depth && ~e.message.indexOf("circular structure") ) {
        jsonstr = "[Circular...]"
      }
      else {
        var sb = []
        for( var k in obj ) {
          sb.push(k+'='+safe_json_stringify(obj[k],depth+1))
        }
        jsonstr = '<'+sb.join(',')+'>'
      }
    }
    return jsonstr
  }




  var spec_check = parambulator(
    {type$:'object',required$:['pin','map'],string$:['prefix'],object$:['pin','map']},
    {topname:'spec',msgprefix:'http(spec): ',callbackmaker:paramerr('seneca/http_invalid_spec')})


  function define_service(instance,spec){
    spec_check.validate(spec)

    var prefix = spec.prefix || '/api/'


    if( !prefix.match(/\/$/) ) {
      prefix += '/'
    }

    if( !prefix.match(/^\//) ) {
      prefix = '/'+prefix
    }

    var pin = instance.pin(spec.pin)


    function makedispatch(act,urlspec,handlerspec) {
      return function( req, res, next ) {

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


    function defaulthandler(req,res,args,act,respond) {
      act(args,respond)
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


      var objstr = err ? JSON.stringify({error:''+err}) : safe_json_stringify(outobj)
      var code   = err ? (err.seneca && err.seneca.httpstatus ?  err.seneca.httpstatus : 500) : (obj && obj.httpstatus$) ? obj.httpstatus$ : 200;

      var redirect = (obj ? obj.redirect$ : false) || (err && err.seneca.httpredirect)

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



    var maprouter = httprouter(function(http){
      for( var fname in pin ) {
        var act = pin[fname]
        var url = prefix + fname
        
        var urlspec = spec.map.hasOwnProperty(fname) ? spec.map[fname] : null
        if( !urlspec ) continue;
        
        // METHOD:true abbrev
        urlspec = _.isBoolean(urlspec) ? {} : urlspec

        if( urlspec.alias ) {
          url = prefix + urlspec.alias
        }

        urlspec.suffix = urlspec.suffix || ''

        var mC = 0, fullurl, dispatch

        for( var mI = 0; mI < httprouter.methods.length; mI++ ) {
          var m = httprouter.methods[mI]

          var handler = urlspec[m] || urlspec[m.toUpperCase()]
          if( handler ) {
            var handlerspec = _.isObject(handler) ? handler : {}
            handlerspec.handler = handlerspec.handler || (_.isFunction(handler) ? handler : defaulthandler)
            dispatch = makedispatch(act,urlspec,handlerspec)
            fullurl = url+urlspec.suffix
            instance.log.debug('http',m,fullurl)
            http[m](fullurl, dispatch)
            mC++
          }
        }

        if( 0 === mC ) {
          dispatch = makedispatch(act,urlspec,{})
          fullurl = url+urlspec.suffix
          instance.log.debug('http','get',fullurl)
          http.get(fullurl, dispatch)
        }
      }

      // FIX: premap may get called twice if map function calls next

      // lastly, try premap by itself against prefix if nothing else matches
      // needed for common auth checks etc
      // ensures premap is always called
      if( spec.premap ) {
        http.get(prefix, function(req,res,next){
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
    })

    
    // startware and endware always called, regardless of prefix

    return function(req,res,next) {
      var si = req.seneca || instance

      if( spec.startware ) {
        spec.startware.call(si,req,res,do_maprouter)
      }
      else do_maprouter();

      function do_maprouter() {
        maprouter(req,res,function(err){
          if(err ) return next(err);

          if( spec.endware ) {
            spec.endware.call(si,req,res,next)
          }
          else next()
        })
      }
    }

    //return maprouter
  }






  /*
  seneca.add({init:plugin}, function( args, done ){
    seneca.act('role:util, cmd:define_sys_entity', {list:[settingsent.canon$()]})
    done()
  })
   */

  var app = connect()
  app.use(connect.static(__dirname+'/web'))

  var use = function(req,res,next){
    if( 0===req.url.indexOf(options.prefix) ) {
      if( 0 == req.url.indexOf(options.prefix+'/init.js') ) {
        res.writeHead(200,{'Content-Type':'text/javascript'})
        return res.end(initsrc);
      }
   
      req.url = req.url.substring(options.prefix.length)
      return app( req, res );
    }
    else return next();
  }

  var config = {prefix:options.prefix}

  seneca.act({role:plugin, plugin:plugin, config:config, use:use})


  
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


  return {
    name: plugin,
    export:web,
    exportmap: {
      httprouter:httprouter
    }
  }
}
