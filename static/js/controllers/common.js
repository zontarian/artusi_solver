//fake service

angular.module('easyradio').factory('Api',function($http, $q, $timeout){
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



angular.module('easyradio').factory('EasyradioApi',function(Api, stateService, constants){
    return {
        start:function(){
            return Api.call('get','/api/system/start');
        },
        stop:function(){
            return Api.call('get','/api/system/stop');
        },
        saveConfig:function(easyradio, meeting, setup, vote_system, vote_config){
            data={
                'setup':setup,
                'vote_config':vote_config,
                'meeting':meeting,
                'vote_system':vote_system,
                'easyradio':easyradio
            }
            return Api.call('post','/api/config',data);
        },
        saveConfigLog:function(log){
            data={
                'log':log
            }
            return Api.call('post','/api/config',data)
        },
        loadConfig:function(){
            return Api.call('get','/api/config');
        },
        savePcBase:function(pcBaseList){
            return Api.call('post','/api/config/pcbase',{'pcbases':pcBaseList});
        },
        readPcBase:function(){
            return Api.call('get','/api/config/pcbase' );
        },
        openVote: function(options) {
            //if (mode == 'N') {
                var url = '/api/vote/open';
            // } else if (mode == 'G') {
            //     var url = '/api/vote/group/open';
            // } else if (mode == 'L') {
            //     var url = '/api/vote/list/open';
            // }
            return Api.call('post', url, options);
        },
        closeVote: function(options) {
            return Api.call('post','/api/vote/close', options);
        },
        closeConfirmVote: function(options){
            return Api.call('post','/api/vote/confirm/close',options)
        },
        sendSimpleMsg: function(options) {
            return Api.call('post','/api/tvt/command', options);
        },
        addCard: function(options) {
            return Api.call('post','/api/card/add', options);
        },
        simpleCommand: function(cardId,commandName,arg ){
            var params={
                cardId: parseInt(cardId),
                command: parseInt(commandName),
                arg: arg
            };
            return Api.call('post','/api/tvt/command',params);
        },
        sendText: function(cardId, text, timeout){
            //timeout can be fractionary.. ie decimal.
            if(!timeout)
                timeout="1";
            else
                timeout=timeout+"";
            //if there is a "." or ",", strip it and consider first digit afterwards
            tt = timeout.split(/[\.,]/);
            if(tt.length==2){
                timeout = parseInt(tt[0]) * 10; //it's expressed in tenth of seconds
                //add first digit of decimal part
                d = tt[1].substring(0,1);
                timeout += parseInt(d);
            }else{
                timeout = parseInt(timeout) * 10; //it's expressed in tenth of seconds
            }
            var params={
                cardId: cardId,
                message: text,
                timeout: timeout,
            };
            return Api.call('post','/api/tvt/text',params);
        },
        add:function(televoterId, baseId){
            var params={
                cardId: televoterId,
                baseId:baseId
            };
            return Api.call('post','/api/tvt/add',params);
        },
        addToAll:function(televoterId){
            var params={
                cardId: televoterId
            };
            return Api.call('post','/api/tvt/add/all',params);
        },
        deleteFromAll:function(cardId){
            var params={
                cardId: cardId,
            };
            return Api.call('post','/api/admission/deAdmitShareholder',params);
        },
        vipToggle:function(televoterId,setVip){
            var params={
                cardId: televoterId,
                isVip:setVip? true : false
            };
            return Api.call('post','/api/tvt/vip',params);
        },
        baseStart:function(baseIds){
            var params={baseIds:baseIds};
            return Api.call('post','/api/commands/base/start',params);
        },
        baseStop:function(baseIds){
            var params={baseIds:baseIds};
            return Api.call('post','/api/commands/base/stop',params);
        },
        baseRestart:function(baseIds){
            var params={baseIds:baseIds};
            return Api.call('post','/api/commands/pcbase/restart',params);
        },
        baseRestartLocked:function(baseIds){
            var params={baseIds:baseIds};
            return Api.call('post','/api/commands/pcbase/restart/locked',params);
        },
        baseSwap:function(baseIds){
            var params={baseIds:baseIds};
            return Api.call('post','/api/commands/pcbase/swap',params);
        },
        baseBroadcast:function(baseIds){
            var params={baseIds:baseIds};
            return Api.call('post','/api/commands/maps/broadcast',params);
        },
        baseLoad:function(baseIds){
            var params={baseIds:baseIds};
            return Api.call('post','/api/commands/maps/load',params);
        },
        setEmulatorState:function(state){
            var params={state:state};
            return Api.call('post','/emulator/set',params);
        },
        checkFolder:function(folder){
            var params={folder:folder};
            return Api.call('post','/api/log/testFolder',params);
        },
        shutdownServer:function(pwd){
            var params={pwd:pwd};
            return Api.call('post','/system/shutdown',params);
        },
        genericApi:function(url,params,method, contentType){
            return Api.call(method,url,params, contentType);
        },
        commands:{
            BEEP: 0x0A,
            DISPLAY_BRIGHTNESS: 0x07,
            FREEZE_ON: 0x21,
            FREEZE_OFF:0x20,
            END_FREEZE:0x08,
            VOTE_ENABLED:25,
            VOTE_DISABLED:26,
            FORCE_VOTE_OPEN:44,
            ENABLED_AND_FORCE_OPEN_VOTE: 53,
            RESET_AND_DISABLE_VOTE: 54,
            CONFIRM_VOTE: 43,
            RESET: 16,
            UNLOCK_FROM_MEETING_ID:33,
            READ_GROUP_CHOICES: 46,
            SET_GROUP_CHOICES: 45,
            SHUTDOWN: 15,
            ERASE_EPROM: 14,
            GO_MEETING_MODE: 126,
            GO_CONVENTION_MODE: 127
        },
        precompiledApis:[
            {
                url: '/api/system/start',
                comment:'start system and pcbases',
                method: 'POST',
            },
            {
                url: '/api/system/stop',
                comment:'stop system and stop pcbases',
                method: 'GET',
            },
            {
                url: '/api/system/ping',
                comment:'ping system an get various internal data',
                method: 'GET',
            },

            // {
            //     url:'/api/tvt/command',
            //     method:'POST',
            //     params:[
            //         {   name: 'cardId', value:'', isNumeric:true, isArray:false, isBoolean:false },
            //         {   name: 'command', value:'', isNumeric:true, isArray:false, isBoolean:false },
            //         {   name: 'arg', value:'', isNumeric:false, isArray:false, isBoolean:false },
            //     ]
            // },
            {
                url:'/api/vote/open',
                comment: 'open a vote',
                method:'POST',
                params:[
                    { name: 'votationId', value:'1', isNumeric:true,  isArray:false, isBoolean:false  },
                    { name: 'votationType', value:'N', isNumeric:false,  isArray:false, isBoolean:false,
                        values:stateService.voteModesForMeetingType[0]
                    },
                    { name: 'resprog', value:'1', isNumeric:true,  isArray:false, isBoolean:false  },
                    { name: 'resolutionKind', value:constants.ResolutionKind[0].value, isNumeric:false,  isArray:false, isBoolean:false ,
                        hint:'', values:constants.ResolutionKind},
                    { name: 'disabledButtons', value:'', isNumeric:false,  isArray:true, isBoolean:false ,
                        hint:'zero or more among Y,N,A,P,X'},
                    { name: 'hiddenTexts', value:'', isNumeric:false,  isArray:true, isBoolean:false ,
                        hint:'zero or more among T,L,R'},
                    { name: 'backupText', value:'', isNumeric:false,  isArray:false, isBoolean:false  },

                    { name: 'timeout', value:'110', isNumeric:true,  isArray:false, isBoolean:false  },
                    { name: 'force', value:true, isNumeric:false,  isArray:false, isBoolean:true  },
                    { name: 'isFake', value:false, isNumeric:false,  isArray:false, isBoolean:true  },
                    { name: 'fakeVoteAnswerTime', value:0, isNumeric:true,  isArray:false, isBoolean:false  },
                    { name: 'fakeVoteAnswerKind', value:'F', isNumeric:false,  isArray:false, isBoolean:false,
                        values: constants.FakeVoteAnswerTypes
                    },
                    { name: 'prepare', value:false, isNumeric:false,  isArray:false, isBoolean:true  },
                    { name: 'extraParams', value:'', isNumeric:false,  isArray:false, isBoolean:false,hint:'a JSON object, see docs'  },

                ]
            },
            {
                url: '/api/vote/close',
                comment: 'close a vote',
                method: 'POST',
                params: [
                    {name: 'votationId', value: '1', isNumeric: true, isArray: false, isBoolean: false},
                    {name: 'resprog', value: '1', isNumeric: true, isArray: false, isBoolean: false},
                    {
                        name: 'force', value: false, isNumeric: false, isArray: false, isBoolean: true,
                        hint: 'Force closing even if not all VIPs votes have been collected'
                    },
                ]
            },
            /*
             (r'/api/vote/fetchsavedvotes', FetchSavedVotesHandler_Api2),
             (r'/api/vote/fetchdata',FetchDataHandler_Api2),
             */
            {
                url: '/api/vote/fetchsavedvotes',
                comment: 'fetch votes at the end of a vote: blocking call',
                method: 'POST',
                params: [
                    {name: 'votationId', value: '1', isNumeric: true, isArray: false, isBoolean: false},
                    {name: 'resprog', value: '1', isNumeric: true, isArray: false, isBoolean: false},
                    {
                        name: 'returnVotes', value: false, isNumeric: false, isArray: false, isBoolean: true,
                        hint: 'return votes'
                    },
                ]
            },
            {
                url: '/api/vote/fetchdata',
                comment: 'fetch votes live during a vote',
                method: 'POST',
                params: [
                    {name: 'votationId', value: '1', isNumeric: true, isArray: false, isBoolean: false},
                    {name: 'incremental', value: false, isNumeric: false, isArray: false, isBoolean: true,
                        hint: 'Return votes since last call'
                    },
                ]
            },
            /*
             (r'/api/tvt/fetchpresence', TvtFetchPresenceHandler_Api2),
             (r'/api/tvt/getnumber', TvtGetNumberHandler_Api2),
             (r'/api/tvt/command', TvtCommandHandler_Api2),

             */
            {
                url:'/api/tvt/fetchpresence',
                method:'POST',
                comment:'Get presences',
                params:[
                ]
            },
            {
                url:'/api/tvt/getnumbers',
                method:'POST',
                comment:'Get number of televoters AND cards',
                params:[
                    {name: 'votationId', value: '1', isNumeric: true, isArray: false, isBoolean: false, hint:'if 0, get total number'},
                ]
            },
            {
                url:'/api/tvt/status',
                method:'POST',
                comment:'Get status of given televoter',
                params:[
                    {   name: 'cardId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                ]
            },
            {
                url:'/api/tvt/command',
                method:'POST',
                comment:'Send message to TVT',
                params:[
                    {   name: 'cardId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'isBroadcast', value:'', isNumeric:false, isArray:false, isBoolean:true },
                    {   name: 'command', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'arg', value:'', isNumeric:true, isArray:false, isBoolean:false , hint:'optional'},
                    {   name: 'message', value:'', isNumeric:false, isArray:false, isBoolean:false , hint:'optional'},
                ]
            },
            /*
             (r'/api/tvt/temporary/enter', TvtTemporaryEnterHandler_Api2),
             (r'/api/tvt/temporary/exit', TvtTemporaryExitHandler_Api2),
             */
            {
                url:'/api/tvt/temporary/enter',
                method:'POST',
                comment:'Re admit a televoter, temporary',
                params:[
                    {   name: 'cardId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                ]
            },
            {
                url:'/api/tvt/temporary/exit',
                method:'POST',
                comment:'Exit a televoter, temporary',
                params:[
                    {   name: 'cardId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'hold', value:false, isNumeric:false, isArray:false, isBoolean:true },
                ]
            },
            {
                url:null,
                comment:'--'
            },
            {
                url:'/api/admission/getShareholderData',
                method:'POST',
                comment:'to admint a card, first call this',
                params:[
                    {   name: 'cardId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'televoterId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'hardwareId', value:'', isNumeric:true, isArray:false, isBoolean:false,hint:'unused' },
                    {   name: 'meetingId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'admissionMode', value:0, isNumeric:true, isArray:false, isBoolean:false , values: constants.AdmissionMode}
                ]
            },
            {
                url:'/api/admission/validateShareholderData',
                method:'POST',
                comment:'then call this method with same parameters',
                params:[
                    {   name: 'televoterId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'cardId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'hardwareId', value:'', isNumeric:true, isArray:false, isBoolean:false, hint:'unused'},
                    {   name: 'meetingId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'shareholderSignature', value:'', isNumeric:false, isArray:false, isBoolean:false, hint:'ignore for now' },
                    {   name: 'signatureFormat', value:'', isNumeric:false, isArray:false, isBoolean:false, hint:'ignore for now' },
                    {   name: 'isSubstitution', value:'', isNumeric:false, isArray:false, isBoolean:true }

                ]
            },
            {
                url:'/api/admission/exchangeHardware',
                method:'POST',
                comment:'then call this method with same parameters',
                params:[
                    {   name: 'oldHardwareId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'newHardwareId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                ]
            },
            {
                url:'/api/admission/updateShareholder',
                method:'POST',
                params:[
                    {   name: 'cardId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'updateRadio', value:true, isNumeric:false, isArray:false, isBoolean:true },
                ]
            },
            {
                url:'/api/admission/listShareholders',
                method:'POST',
                comment: 'list all shareholders in DB',
                params:[
                    {   name: 'search', value:'', isNumeric:false, isArray:false, isBoolean:false },
                    {   name: 'start', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'count', value:'', isNumeric:true, isArray:false, isBoolean:false },

                ]
            },
            {
                url:'/api/admission/deAdmitShareholder',
                method:'POST',
                comment: 'remove association between tvt and card id',
                params:[
                    {   name: 'cardId', value:'', isNumeric:true, isArray:false, isBoolean:false },
                    {   name: 'removeVotes', value:'', isNumeric:false, isArray:false, isBoolean:true },
                ]
            },
            {
                url:'/tvt/addalldb',
                method:'POST',
                comment: 'auto admit some shareholder',
                params:[
                    {   name: 'from', value:'', isNumeric:true, isArray:false, isBoolean:false, hint:'cardId, inclusive, >=' },
                    {   name: 'to', value:'', isNumeric:true, isArray:false, isBoolean:false, hint:'cardId, inclusive, <='  },

                ]
            },
            {
                url:null,
                comment:'--'
            },
            {
                url:'/api/config/getInitZip',
                method:'POST',
                comment:'require a zip file',
                params:[
                    {   name: 'version', value:'', isNumeric:true, isArray:false, isBoolean:false, hint:"can be null, thus requiring latest" },
                ]
            },
            {
                url:'/api/config/setInitXml',
                method:'POST',
                content_type:'undefined',
                comment:'send init XML file to SYC',
                params:[
                    {   name: 'xml', value:'', isNumeric:false, isArray:false, isBoolean:false, isFile:true},
                ]
            },
            // {
            //     url:'/api/log/testFolder',
            //     method:'POST',
            //     params:[
            //         {   name: 'folder', value:'', isNumeric:false, isArray:false, isBoolean:false },
            //
            //     ]
            // }
        ]
    }
});

angular.module('easyradio').factory('EasyvoteApi',function(Api){
    return {

        getVotations:function(baseurl){
            console.error("Use configured value.. not this hardocede for Easyvote API endopint")
            return Api.call('get', baseurl+ /*'http://localhost:8000 */ '/api'+'/votations/search');
        }

    }

});
