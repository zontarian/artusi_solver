angular.module('robamolle', ['ui.router'] )
    .config(function ($interpolateProvider, $stateProvider, $urlRouterProvider) {
        // No conflict per sintassi template django
        $interpolateProvider.startSymbol('{$');
        $interpolateProvider.endSymbol('$}');

        // // redirect if path not found
        $urlRouterProvider.otherwise('/artusi');
        //
        // //disable cheatsheet of HotKeys that does not work
        // // hotkeysProvider.includeCheatSheet = false;
        //
        $stateProvider
            .state('artusi', {
                url: "/artusi",
                templateUrl: "/static/html/artusi.html",
                controller:'ArtusiCtrl'
            });
    })
    .directive('focusOn', function() {
        return function(scope, elem, attr) {
            scope.$on('focusOn', function(e, name) {
                if(name === attr.focusOn) {
                    elem[0].focus();
                }
            });
        };
    })
    .directive('file', function() {
        return {
            require:"ngModel",
            restrict: 'A',
            link: function($scope, el, attrs, ngModel){
                el.bind('change', function(event){
                    var files = event.target.files;
                    var file = files[0];

                    ngModel.$setViewValue(file);
                    $scope.$apply();
                });
            }
        };
    })
    .factory('focus', function ($rootScope, $timeout) {
        return function(name) {
            $timeout(function (){
                $rootScope.$broadcast('focusOn', name);
            });
        };
    })
    .factory('format', function () {
        return function(formatstr, params ) {
            $.each(params,function (i, n) {
                formatstr = formatstr.replace(new RegExp("\\{" + i + "\\}", "g"), n);
            })
            return formatstr;
        };
    })


    .run(function ( $timeout) {
        //init session storage
        //config = $sessionStorage.config;
        //config=null;

    });


function setupUI() {

    // //console.log("Doc ready");
    // $('input').iCheck({
    //     checkboxClass: 'icheckbox_flat-blue',
    //     radioClass: 'iradio_flat-blue'
    // });
}
