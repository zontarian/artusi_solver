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

    function test_canvas(){
        var c=document.getElementById("canvas");
        var context=c.getContext("2d");
        // var img=document.getElementById("server-image");
        sample='/static/tmp/IMG_1502.jpg'
        _w = $(c).width();
        _h = $(c).height();
        c.setAttribute('width', ''+_w);
        c.setAttribute('height', ''+_h);

        //hide true image
        // $(img).css({'display':'none'});

        var imageObj = new Image();
        imageObj.src = sample; //$scope.artusi.solution_url;
        console.log(imageObj.src)
        imageObj.onload = function(){
            w = $(c).width();
             _h = $(c).height();
            // w=50
            ratio = 1136 / 640;
            h = w * ratio;
            context.drawImage(imageObj,0,0,w,h );

            sqw = w / 9
            //draw on top sample square
            context.beginPath();
            context.rect(188, 50,sqw, sqw);
            context.fillStyle = "rgba(255, 255, 0, 0.5)";
            context.fill();
        }
    }

    $scope.autosubmit = function () {
        callSolver(true, function(success){
            if(!success)
                return;

            // var c=document.getElementById("canvas");
            // var context=c.getContext("2d");
            // var img=document.getElementById("server-image");
            // img.src=$scope.artusi.solution_url;
            //
            // //hide true image
            // $(img).css({'display':'none'});
            //
            // var imageObj = new Image();
            // imageObj.src = $scope.artusi.solution_url;
            // console.log(imageObj.src)
            // imageObj.onload = function(){
            //     w = $(c).width();
            //     _h = $(c).height();
            //     w=50
            //     h = w*2
            //     context.drawImage(imageObj,0,0,h,w );
            // };
            //
            // // var canvas = document.getElementById('canvas');
            // // var context = canvas.getContext('2d');
            //
            // context.beginPath();
            // context.rect(188, 50, 200, 100);
            // context.fillStyle = 'yellow';
            // context.fill();
            // context.lineWidth = 7;
            // context.strokeStyle = 'black';
            // context.stroke();
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

    $timeout(function(){
        // test_canvas()
    },0)


});
