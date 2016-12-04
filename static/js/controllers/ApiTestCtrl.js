/**
 * Created by walter on 08/12/15.
 */
angular.module('easyradio').controller('ApiTestCtrl', function ($scope, $http, $timeout, $q, EasyradioApi, stateService) {
    // all the items

    //
    $scope.params=[ ];
    $scope.url='';
    $scope.method='post';
    $scope.apiResult='';
    $scope.apiError=null;
    $scope.paramIdx=0;
    $scope.apiCall='';

    $scope.precompiledApis = EasyradioApi.precompiledApis;

    $scope.testApi=function(){
        if(!$scope.method)
            $scope.method='post';

        $scope.apiResult='';
        $scope.apiError=null;

        var ps={};
        var ct=null;
        var formData = null;
        var isFileUpload=false;
        //first decide if there is a File
        $scope.params.forEach(function(p){
            if(p.type=='file' && p.name){
                isFileUpload = true;
                formData =new FormData();
                return;
            }
        });


        $scope.params.forEach(function(p){
            if(p.name==null || p.name=='')
                return;
            if(p.isArray){
                var pps= p.value.split(",");
                if(pps.length == 1 && pps[0]=="")
                    pps=[]
                if(p.type=='numeric'){
                    var pz=[];
                    pps.forEach(function(pp){
                        pz.push(parseInt(pp));
                    });
                    pps=pz;
                }
                if(isFileUpload)
                    formData.append(p.name, pps)
                else
                    ps[p.name]=pps;
            }else{
                val = null;
                if(p.type=='numeric') {
                    val =parseInt(p.value);
                }
                else if(p.type=='boolean') {
                    val =(p.value == 'true' || p.value == true || false);
                }
                else if(p.type=='file'){
                    var el=$('#apivalue-'+p.name);
                    fs = el[0].files;
                    fss = fs[0];
                    val = fss;
                }
                else
                    val = p.value;

                if(val != null) {
                    if (isFileUpload)
                        formData.append(p.name, val)
                    else
                        ps[p.name] = val;
                }
            }
        });

        $scope.apiCall=$scope.method+" "+$scope.url+" "+JSON.stringify(ps);

        if(isFileUpload) {
            ps = formData;
            ct = 'undefined';
            $scope.method = 'POST'; ///by default
        }

        EasyradioApi.genericApi($scope.url,ps,$scope.method, ct).then(function(data){
            console.log("api called",data);
            $scope.apiResult=JSON.stringify(data,null,"  ");
        },function(err){
            console.error(err);
            $scope.apiError=true;
            $scope.apiResult=JSON.stringify(err.data,null,"  ");;
        });
    };

    $scope.addParam=function(){
        $scope.params.push({
            name:null,
            value:null,
            isArray:false,
            type:'string',
            precompiled:false
        });
    };

    $scope.removeParam=function(idx){
        if($scope.params.length==1){
           // $scope.params=[];
        }
        else
            $scope.params=$scope.params.splice(idx,1);
    };

    $scope.addParam();

    $scope.clearResults =function(){
        $scope.apiError=null;
        $scope.apiResult=null;
    }

    console.log("API TEST")

    //apply select2 lib to select
    $timeout(function(){
        $(document).ready(function() {
            $("#api-select").select2();
        });
    },0);

    $scope.selctedApi=function(item){
        console.log(item,$scope.url);
        //get item
        $scope.precompiledApis.forEach(function(api){
            if(api.url==$scope.url){
                //set method
                $scope.method=api.method.toLowerCase();
                //clear all params
                $scope.params=[];
                //add params
                if(api.params) {
                    api.params.forEach(function (p) {
                        $scope.params.push({
                            name: p.name,
                            value: p.value,
                            isArray: p.isArray,
                            isNumeric: p.isNumeric,
                            type: p.isBoolean ? 'boolean' : (p.isNumeric ? 'numeric' : (p.isFile ? 'file' : 'string')),
                            values: p.values ? p.values : null,
                            hint: p.hint || p.comment,
                            precompiled:true

                        });
                    });
                }
            }
        });
    }
});
