;(function(angular,moment) {
  "use strict";

  var root = this
  var seneca = root.seneca
  var prefix = (seneca.config.web ? seneca.config.web.prefix : null ) || '/seneca'
  var adminprefix = (seneca.config.admin ? seneca.config.admin.prefix : null ) || '/admin'


  var senecaWebServiceModule = angular.module('senecaWebServiceModule',[])



  senecaWebServiceModule.directive('senecaWebService', ['$http',function($http) {
    var def = {
      restrict:'A',
      scope:{
      },

      link: function( scope, elem, attrs ){
        scope.pluginrows = []

        scope.load = function() {
          $http({method: 'GET', url: adminprefix+'/webstats', cache: false}).
            success(function(urlmap, status) {
              scope.urlrows = []
              
              var urlrows = []
              var index = 1

              _.each(urlmap,function(meta,url){
                var urlparts = url.split(';')
                urlrows.push(
                  { 
                    plugin: urlparts[0], 
                    method: urlparts[1], 
                    url:    urlparts[2], 
                    count:  (meta.count||0),
                    min:    (meta.min||0).toPrecision(4),
                    max:    (meta.max||0).toPrecision(4),
                    mean:   (meta.mean||0).toPrecision(4),
                    rate:   (meta.rate||0).toPrecision(4),
                  })
              })

              scope.urlrows = urlrows
            })
        }
      },

      controller: function( $scope, $rootScope ) {
        $scope.gridOptions = {
          data: 'urlrows',
          enableColumnResize:true,
          columnDefs: [
            { field: "plugin", displayName:'Plugin', width:100  },
            { field: "method", displayName:'Method', width:100  },
            { field: "url",    displayName:'Url',    width:400  },
            { field: "count",  displayName:'Count',  width:100  },
            { field: "min",    displayName:'Min',    width:100  },
            { field: "max",    displayName:'Max',    width:100  },
            { field: "mean",   displayName:'Mean',   width:100  },
            { field: "rate",   displayName:'Rate',   width:100  },
          ]
        }

        $rootScope.$on('seneca-admin/unit/web-service/view',function(){
          $scope.load()

          $scope.reloader = setInterval($scope.load,2222)
        })

        $rootScope.$on('seneca-admin/unit/web-service/hide',function(){
          if( $scope.reloader ) {
            clearInterval( $scope.reloader )
          }
        })
      },
      
      templateUrl: prefix+"/_web_service_template.html"
    }

    return def
  }])


}.call(window,angular,moment));

