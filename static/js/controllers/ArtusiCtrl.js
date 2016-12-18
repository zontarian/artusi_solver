/**
 * Created by walter on 08/12/15.
 */
angular.module('robamolle').controller('ArtusiCtrl', function ($scope, $http, $timeout, $q, ArtusiAPI) {
    // all the items
    $scope.artusi={
        image:null,
        solution_image:null,
        solution_url:"",
        is_solution:false
    };
    $scope.image_arrived = false;
    //
    function _arrayBufferToBase64( buffer ) {
        var binary = '';
        var bytes = new Uint8Array( buffer );
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
        }
        return window.btoa( binary );
    }

    $scope.autosubmit = function () {
        callSolver(true, function(success){

        });
        $scope.image_arrived = false;
    };

    $scope.solve = function(){

        callSolver(false, function(success){
            $scope.artusi.image=null;
            $scope.artusi.is_solution=true;
        });
        $scope.image_arrived = false;
    };

    $scope.rescan = function(){
        console.log($scope.artusi)
    };

    $scope.reset = function(){
        $scope.artusi={
            image:null,
            solution_image:null,
            solution_url:"",
            is_solution:false
        };
    };

    function callSolver(show_step, callback){
        $scope.artusi.solution_url = '/static/css/loading.gif';
        ArtusiAPI.upload('#artusi-image', show_step).then(function(data){
            console.log("api called",data.url);
            $scope.artusi.solution_url = data.url;
            $scope.image_arrived = true;
            if(callback)
                callback(true)
        },function(err){
            console.error(err);
            alertify.error("Error:<br />"+err.data.errorCode)
            $scope.image_arrived = false;
            $scope.artusi.solution_url = null;
            $scope.artusi.image = null;
            if(callback)
                callback(false)
        });
    }

});
