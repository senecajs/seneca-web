'use strict'

var Seneca = require('seneca')
var Web = require('../../')

var seneca = Seneca()

seneca.use(Web)

seneca.ready((err) => {
  console.log(err || '')

  var config = {
    name: 'fake'
    adapter: (config) => {
      //console.log(config.msg)
    }
  }

  seneca.act(config, (err, reply) => {

  })

  seneca.export('web/setServer')(config, (err, reply) => {
    seneca.act('role:web', {
      spec: {
        prefix: '/todo',
        pin: 'role:todo,cmd:*',
        map: {
          new: true,
          edit: {GET: true, POST: true},
          delete: {DELETE: true}
        }
      }
    })
  })
})
