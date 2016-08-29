'use strict'

var Assert = require('assert')

var Request = require('supertest')
var Cookieparser = require('cookie-parser')
var Bodyparser = require('body-parser')
var Util = require('./util.js')

exports.init = function (done) {
  var seneca = Util.initSeneca()
  seneca.ready(function (err) {
    Assert(!err, 'Seneca configured')

    var app = require('express')()
    app.use(Cookieparser())
    app.use(Bodyparser.json())

    seneca.use(function p0 () {
      this.add('role:api,cmd:c0', function (args, response) {
        var out = {
          r0: 'r0' + args.a0,
          r1: 'r1' + args.a1,
          r2: 'r2' + args.a2,
          x0: 'r' + args.req$.x0,
          bad$: 'should-not-appear-in-response',
          http$: {
            headers: {
              h0: 'i0'
            }
          }
        }

        if (args.c) {
          out.c = args.c
        }

        response(null, out)
      })

      this.add('role:api,cmd:c1', function (args, response) {
        response(null, {d0: args.d0 + 'f0'})
      })

      this.add('role:api,cmd:x1', function (args, response) {
        response(null, {x: args.x})
      })

      this.add('role:api,cmd:x2', function (args, response) {
        if (args.data && args.data.x) {
          return response(null, {x: args.data.x, loc: 1})
        }
        response(null, {x: args.x, loc: 0})
      })
      this.add('role:api,cmd:c2', function (args, response) {
        var src = 'PUT' === args.req$.method ? args.data : args
        response(null, {d1: src.d1 + 'f1', d2: src.d2})
      })

      this.add('role:api,cmd:e0', function (args, response) {
        response(new Error('e0'))
      })

      this.add('role:api,cmd:e1', function (args, response) {
        response(new Error('e1'))
      })

      this.add('role:api,cmd:n0', function (args, response) {
        response(null, {
          name: args.name,
          id: args.id
        })
      })

      this.add('role:api,cmd:r0', function (args, response) {
        response(null, {
          ok: false,
          why: 'No input will satisfy me.',
          http$: {
            status: 400
          }
        })
      })

      this.act('role:web', {
        use: {
          prefix: '/t0',
          pin: 'role:api,cmd:*',
          startware: function (req, res, next) {
            req.x0 = 'y0'

            if (req.body && 'a' === req.body.a) {
              req.body.a = 'A'
            }

            if (req.body && 'b' === req.body.b) {
              req.body.b = 'B'
            }

            next()
          },
          premap: function (args, req, res, next) {
            if (args.c) {
              args.c = 'C'
            }

            next()
          },
          map: {
            x1: {
              POST: true
            },
            x2: {
              data: true,
              POST: true
            },
            c0: {
              alias: '/a0/:a0',
              GET: true,
              POST: function (req, res, args, act, response) {
                args.a0 = 'p' + args.a0
                act(args, function (err, out) {
                  if (err) return response(err)

                  out.r1 = 'p' + out.r1
                  out.c = args.c || undefined
                  response(null, out)
                })
              },
              PUT: {
                useparams: false,
                usequery: false,
                handler: function (req, res, args, act, response) {
                  args.a1 = 'p' + args.a1
                  act(args, response)
                },
                modify: function (result) {
                  result.out.o0 = 'p0'
                  delete result.out.bad$
                },
                responder: function (req, res, err, obj) {
                  obj.q0 = 'u0'
                  res.end(JSON.stringify(obj))
                }
              }
            },

            // GET will be used as default method
            c1: {
              data: true
            },

            // GET not defined!!
            c2: {
              data: true,
              PUT: true,
              POST: {data: false}
            },

            e0: true,
            e1: {
              responder: function (req, res, err, obj) {
                if (err) {
                  // plain text for errors, no JSON
                  res.writeHead(500)

                  // seneca formatted Error object
                  res.end(err.details.message)
                }
                else res.send(obj)
              }
            },

            n0: {
              alias: '/n0/:name/:id'
            },

            r0: true
          }
        }
      })
    })

    app.get('/a', function (req, res) {
      res.send('A')
    })
    app.post('/a', function (req, res) {
      res.send({a: req.body.a, c: req.body.c || undefined})
    })
    app.use(seneca.export('web'))
    app.get('/b', function (req, res) {
      res.send('B')
    })
    app.post('/b', function (req, res) {
      res.send({b: req.body.b, c: req.body.c || undefined})
    })

    var Agent = Request(app)
    done(null, Agent, seneca)
  })
}
