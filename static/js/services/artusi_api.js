
angular.module('robamolle').factory('Api',function($http, $q, $timeout){
    return {
        call:function(method, url, data, contentType){
            var deferred=$q.defer();

            if(!data)
                data={}

            params = {
                method: method.toUpperCase(),
                url: url,
                data: data
            };
            if(contentType){
                params.headers= {
                    'Content-Type': contentType=='undefined' ? undefined : contentType
                };
            }

            $http(params).then(function success(response){
                console.log("API "+url+" called successfully!",response)
                deferred.resolve(response.data)
            },function error(response){
                console.error('API ERROR:',response);
                return deferred.reject(response)
                //return response;
            });

            return deferred.promise;
        },
        fakeCall:function(method,url,data,returnData, executionTime){
            var deferred = $q.defer();

            if(executionTime == undefined)
                executionTime=1000;

            $timeout(function() {

                deferred.resolve(returnData);
            }, executionTime);

            return deferred.promise;
        }
    }
});



angular.module('robamolle').factory('ArtusiAPI',function(Api ) {
    return {
        start: function () {
            return Api.call('get', '/api/system/start');
        },
        upload: function(selector){
            formData =new FormData();
            var el=$(selector);
            fs = el[0].files;
            fss = fs[0];
            val = fss;
            formData.append('image_file', val);
            formData.append('as_url',true);
            return Api.call('post','/artusi/upload',formData,'undefined')
        },
        genericApi:function(url,params,method, contentType){
            return Api.call(method,url,params, contentType);
        },

    }
});