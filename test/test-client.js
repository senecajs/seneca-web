var assert = require('assert')

var needle = require('needle')



var url = 'http://localhost:3001/t0/a0/b0?a1=b1&a2=b2'
console.log('GET '+url)
needle.get(url,function(err,res){
  assert.ok( !err )
  assert.equal( res.headers.h0, 'i0' ) 
  assert.deepEqual(res.body,{ r0: 'r0b0', r1: 'r1b1', r2: 'r2b2', x0: 'ry0' })
})


url = 'http://localhost:3001/t0/a0/b0?a1=b1',
console.log('POST '+url)
needle.post(
  url,
  {a2:'b2',c:'c'},
  {json:true},
  function(err,res){
    assert.ok( !err )
    assert.deepEqual(res.body,
                     { r0: 'r0pb0', r1: 'pr1b1', r2: 'r2b2', x0: 'ry0', c: 'C' })
  })


url = 'http://localhost:3001/t0/a0/b0?a1=b1',
console.log('PUT '+url)
needle.put(
  url,
  {a2:'b2'},
  {json:true},
  function(err,res){
    assert.ok( !err )
    assert.equal( ''+res.body,
                  '{"r0":"r0undefined","r1":"r1pundefined","r2":'+
                  '"r2b2","x0":"ry0","http$":{"headers":{"h0":"i0"}},'+
                  '"o0":"p0","q0":"u0"}' )

  })


var url = 'http://localhost:3001/t0/c1?d0=e0'
console.log('GET '+url)
needle.get(url,function(err,res){
  assert.ok( !err )
  assert.deepEqual( res.body, { d0: 'e0f0' } )
})


url = 'http://localhost:3001/t0/c2',
console.log('POST '+url)
needle.post(
  url,
  {d1:'e1',d2:'e2'},
  {json:true},
  function(err,res){
    assert.ok( !err )
    assert.deepEqual( res.body, { d1: 'e1f1', d2: 'e2' } )
  })

url = 'http://localhost:3001/t0/c2',
console.log('PUT '+url)
needle.put(
  url,
  {d1:'e1',d2:'e2'},
  {json:true},
  function(err,res){
    assert.ok( !err )
    assert.deepEqual( res.body, { d1: 'e1f1', d2: 'e2' } )
  })

url = 'http://localhost:3001/t0/c3',
console.log('GET '+url)
needle.get(url,function(err,res){
  assert.ok( !err )
  assert.deepEqual( res.body, [{a:1}, {b:2}] )
  assert.ok( res.headers );
  assert.equal( res.headers.foo, 'bar' );
})

var url = 'http://localhost:3001/t0/e0'
console.log('GET '+url)
needle.get(url,function(err,res){
  assert.ok( !err )
  assert.equal(500,res.statusCode)
  assert.deepEqual( res.body, { error: 'Error: seneca: Action cmd:e0,role:api failed: e0.' } )
})

var url = 'http://localhost:3001/t0/e1'
console.log('GET '+url)
needle.get(url,function(err,res){
  assert.ok( !err )
  assert.equal(500,res.statusCode)
  assert.equal( ''+res.body, 'e1' )
})

var url = 'http://localhost:3001/t0/r0'
console.log('GET '+url)
needle.get(url,function(err,res){
  assert.ok( !err )
  assert.equal(400,res.statusCode)
  assert.deepEqual( res.body, { ok: false, why: 'No input will satisfy me.' } )
})


var url = 'http://localhost:3001/a'
console.log('GET '+url) // non-interference with preceding middleware
needle.get(url,function(err,res){
  assert.ok( !err )
  assert.equal(200,res.statusCode)
  assert.equal( res.body, 'A' )
})
console.log('POST '+url) // startware not triggered
needle.post(url,{a:'a'},{json:true},function(err,res){
  assert.ok( !err )
  assert.equal(200,res.statusCode)
  assert.deepEqual( res.body, {a:'a'} )
})
console.log('POST '+url) // premap not triggered
needle.post(url,{a:'a',c:'c'},{json:true},function(err,res){
  assert.ok( !err )
  assert.equal(200,res.statusCode)
  assert.deepEqual( res.body, {a:'a',c:'c'} )
})


var url = 'http://localhost:3001/b'
console.log('GET '+url) // non-interference with following middleware
needle.get(url,function(err,res){
  assert.ok( !err )
  assert.equal(200,res.statusCode)
  assert.equal( res.body, 'B' )
})
console.log('POST '+url) // startware triggered as following!
needle.post(url,{b:'b'},{json:true},function(err,res){
  assert.ok( !err )
  assert.equal(200,res.statusCode)
  assert.deepEqual( res.body, {b:'B'} )
})
console.log('POST '+url) // premap not triggered as no map
needle.post(url,{b:'b',c:'c'},{json:true},function(err,res){
  assert.ok( !err )
  assert.equal(200,res.statusCode)
  assert.deepEqual( res.body, {b:'B',c:'c'} )
})
