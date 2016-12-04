/**
 * Created by walter on 30/11/15.
 */
angular.module('easyradio').controller('LogsCtrl',   function($rootScope, $scope, $http, $timeout, $q, EasyradioApi, stateService) {
    // all the items
    $scope.logs='';

    $scope.log = stateService.config.log;

    $scope.folder_valid = {};

    $rootScope.$on('new_log',function(){
        console.log("Received new log");
        _updateLogs();

        $scope.$apply();
    });

    $rootScope.$on('DATA_UPDATED', function() {
        $scope.log = stateService.config.log;
    });

    function _updateLogs(){
        $scope.logs="";
        var ll='';
        stateService.logs.forEach(function(l){

            var a= '['+l.timestamp + '] '+ l.severity + ' '+ l.msg + ' on '+l.pcb;
            if(ll=='')
                ll=a;
            else
                ll=ll+"\n"+a;

        });
        $scope.logs = ll;
    };


    $scope.canSaveConfig = function(){
        return $scope.formconfig.$dirty;
    }
    
    $scope.saveConfig = function () {
        EasyradioApi.saveConfigLog($scope.log).then(function(){
            console.log("LOG:",$scope.log);

            //reset form to its original status
            $scope.formconfig.$setPristine();
        })
    }

    $scope.checkFolder= function(folder){
        EasyradioApi.checkFolder(folder).then(function(){
            console.log("Check folder ok "+folder)
            $scope.folder_valid[folder] = true
        },function(){
            //error
            $scope.folder_valid[folder]  = false
            console.error("Check folder error "+folder)
        })
    }

    $scope.isValid = function(folder){
        return $scope.folder_valid[folder];
    }

    _updateLogs();
    //check folders
    for(f in $scope.log){
        $scope.checkFolder($scope.log[f]);
    }

});
