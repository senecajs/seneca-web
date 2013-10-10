
var seneca = require('seneca')()
seneca.use( '..' )


seneca.ready(function(){

  var userpin = seneca.pin({role:'user',cmd:'*'})

  userpin.register( {name:"Flann O'Brien",email:'nincompoop@deselby.com',password:'blackair'}, function(err,out) {

    userpin.login({email:'nincompoop@deselby.com',password:'bicycle'}, function(err,out){
      console.log('login success: '+out.ok)

      userpin.login({email:'nincompoop@deselby.com',password:'blackair'}, function(err,out){
        console.log('login success: '+out.ok)
        console.log('login instance: '+out.login)
      })
    })
  })


  // override by using the same action pattern
  seneca.add({role:'user',cmd:'register'},function(args,done){

    // assign user to one of 10 random "teams"
    args.team = Math.floor( 10 * Math.random() )

    // this calls the original action, as provided by the user plugin
    this.parent(args,done)
  })


  userpin.register( {name:"Brian O'Nolan",email:'brian@swim-two-birds.com',password:'na-gCopaleen'}, function(err,out) {
    console.log('user has team: '+out.user.team)
  })

})
