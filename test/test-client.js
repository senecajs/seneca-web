var assert = require('assert')

var needle = require('needle')


var url = 'http://localhost:3001/t0/a0/b0?a1=b1&a2=b2'
console.log('GET '+url)
needle.get(url,function(err,res){
  assert.ok( !err )
  assert.deepEqual(res.body,{ r0: 'r0b0', r1: 'r1b1', r2: 'r2b2', x0: 'ry0' })
})


url = 'http://localhost:3001/t0/a0/b0?a1=b1',
console.log('POST '+url)
needle.post(
  url,
  {a2:'b2'},
  {json:true},
  function(err,res){
    assert.ok( !err )
    assert.deepEqual(res.body,{ r0: 'Xr0pb0', r1: 'pr1b1', r2: 'r2b2', x0: 'ry0' })
  })

