/**
 * Created by walter on 08/12/15.
 */
angular.module('robamolle').controller('ArtusiCtrl', function ($scope, $http, $timeout, $q, ArtusiAPI) {
    // all the items
    $scope.artusi={
        image:null,
        solution_image:null
    }
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


    $scope.upload = function(){
        ArtusiAPI.upload('#artusi-image').then(function(data){
            console.log("api called",data.url);
            // $scope.apiResult=JSON.stringify(data,null,"  ");
            // var b64encoded =  btoa(unescape(encodeURIComponent(data)));
            // $scope.artusi.solution_image = b64encoded;
            //args = JSON.parse(data.data)
            // a = new FileReader()
            // a.readAsDataURL(data)
            // url = URL.createObjectURL(data)
            $scope.artusi.solution_url = data.url;
        },function(err){
            console.error(err);

        });
    }

});
