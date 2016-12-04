angular.module('easyradio')
    .controller('HeaderCtrl', function ($scope, $http, EasyradioApi, stateService, $rootScope, stateService) {


        $rootScope.$on('DATA_UPDATED', function() {
            $scope.version=stateService.config.version;
            $scope.log = stateService.config.log;
        });



        $scope.logConfigError = function(){
            if(!$scope.log.valid)
                return "fa-exclamation-circle status-off";
            return '';
        }

        $scope.version=stateService.config.version;
        $scope.log = stateService.config.log;

    });
