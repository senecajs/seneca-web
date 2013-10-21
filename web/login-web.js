;(function(angular){
  "use strict";

  function empty(val) { return null == val || 0 == ''+val }


  var seneca = this.seneca || {}
  var config = (seneca.config ? seneca.config.auth : {} )



  var senecaLoginModule = angular.module('senecaLoginModule',[])

  senecaLoginModule.controller('Main', function($scope) {
    $scope.show_login = true
  })



  var msgmap = {
    'unknown': 'Unable to perform your request at this time - please try again later.',
    'missing-fields': 'Please enter the missing fields.',
    'user-not-found': 'That username is not recognized.',
    'invalid-password': 'That password is incorrect',
  }


  // TODO: should not need to do this manually
  senecaLoginModule.service('auth', function($http,$window,$location) {
    return {
      login: function(creds,win,fail){
        $http({method:'POST', url: '/auth/login', data:creds, cache:false}).
          success(function(data, status) {
            if( win ) return win(data);

            return $window.location.href = config.logins[$location.pathname].redirect
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

      instance: function(win,fail){
        $http({method:'GET', url: '/auth/instance', cache:false}).
          success(function(data, status) {
            if( win ) return win(data);
          }).
          error(function(data, status) {
            if( fail ) return fail(data);
          })
      },

    }
  })



  senecaLoginModule.controller('Login', function($scope, $rootScope, $window, $location, auth) {

    function read() {
      return {
        nick:     !empty($scope.input_nick),
        password: !empty($scope.input_password)
      }
    }
    

    function markinput(state,exclude) {
      _.each( state, function( full, field ){
        if( exclude && exclude[field] ) return;
        $scope['seek_'+field] = !full
      })

      $scope.seek_signin = !state.nick || !state.password
    }



    function perform_signin() {
      auth.login({
        nick:$scope.input_nick,
        password:$scope.input_password
      }, null, function( out ){
        $scope.msg = msgmap[out.why] || msgmap.unknown
        $scope.showmsg = true
        if( 'user-not-found' == out.why ) $scope.seek_nick = true;
        if( 'invalid-password' == out.why ) $scope.seek_password = true;
      })
    }

    var visible = {
      nick:true,
      password:true,
      signin:true,
    }


    function show(fademap) {
      _.each( fademap, function(active,name){
        $scope['hide_'+name]=!active

        if( active && !visible[name] ) {
          visible[name]           = true
          $scope['fadeout_'+name] = false
          $scope['fadein_'+name]  = true
        }

        if( !active && visible[name] ) {
          visible[name]           = false
          $scope['fadein_'+name]  = false
          $scope['fadeout_'+name] = true
        }
      })      
    }


    $scope.signin = function() {
      $scope.showmsg = false

      var state = read()

      if( $scope.signin_hit ) {
        markinput(state,{nick:1})
      }

      if( state.nick && state.password ) {
        perform_signin()
      }
      else {
        $scope.msg = msgmap['missing-fields']
        $scope.showmsg = true
      }

      $scope.signin_hit = true
      $scope.mode = 'signin'
    }




    $scope.change = function( field ) {
      if( $scope.signin_hit ) return markinput(read());
    }


    $scope.loginredirect = function() {
      return $window.location.href = config.logins[$location.pathname].redirect
    }


    $scope.mode = 'none'
    $scope.user = null

    $scope.showmsg = false

    $scope.signin_hit = false

    $scope.input_nick = ''
    $scope.input_password = ''

    $scope.seek_nick = false
    $scope.seek_password = false

    $scope.hasuser = !!$scope.user

    auth.instance(function(out){
      $scope.user = out.user
      $scope.hasuser = !!$scope.user
      $rootScope.$emit('instance',{user:out.user})
    })
  })

}).call(this,angular);


