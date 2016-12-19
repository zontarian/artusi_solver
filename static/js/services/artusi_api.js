
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
        upload: function(selector, show_step, matrix, server_img){
            show_step = show_step == undefined ? true : show_step;
            matrix = matrix == undefined || ! matrix ? null : matrix;
            server_img = server_img==undefined ? null : server_img;

            formData =new FormData();
            var el=$(selector);
            fs = el[0].files;
            fss = fs[0];
            val = fss;
            enc_matrix = matrix;// atob(matrix);
            formData.append('image_file', val);
            formData.append('as_url',true);
            formData.append('show_step',show_step);
            if(matrix)
                formData.append('matrix', enc_matrix);
            if(server_img)
                formData.append('tmp_img', server_img);

            return Api.call('post','/artusi/upload',formData,'undefined')
        },
        genericApi:function(url,params,method, contentType){
            return Api.call(method,url,params, contentType);
        },

    }
});