'use strict'

var storage = [
  {id: 1, username: 'jack', password: 'admin', displayName: 'Jack', email: 'jack@example.com'},
  {id: 2, username: 'jill', password: 'admin', displayName: 'Jill', email: 'jill@example.com'}
]

function findById (id, cb) {
  process.nextTick(() => {
    var idx = id - 1

    if (storage[idx]) {
      cb(null, storage[idx])
    }
    else {
      cb(new Error('User ' + id + ' does not exist'))
    }
  })
}

function findByUsername (username, cb) {
  process.nextTick(() => {
    for (var i = 0, len = storage.length; i < len; i++) {
      var record = storage[i]

      if (record.username === username) {
        return cb(null, record)
      }
    }

    return cb(null, null)
  })
}

exports.users = {
  findById: findById,
  findByUsername: findByUsername
}
