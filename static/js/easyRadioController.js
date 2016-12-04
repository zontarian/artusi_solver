angular.module('easyradio')
    .controller('EasyRadioCtrl', function ($scope, $http, EasyradioApi, stateService, $rootScope, $loading, $interval,
                                           $sce, $timeout, constants, formatError, $window, grid) {

        console.log("Vote Type:"+constants.VoteType.YESNO);

        //get local URL.
        var host=window.location.host;
        var WEBSOCKETURL = 'ws://'+host+'/ws';
        var ws = null;

        var auto_open = true;

        $scope.startStopping=false;
        $scope.filter={};
        $scope.num_cards = 0;
        $scope.num_tvts = 0;
        $scope.vc ={vote_close_force : false};
        $scope.admissionColor = constants.AdmissionColor;
        $scope.admissionValue = constants.AdmissionValues;
        $scope.mini_elapsed = null;

        var reconnectTimeout=null;
        // var televoter_list = [];

        //next Time Callback is a function that, given the old timeout, returns a new timeout for next call,
        //ie function(t){ return new_t(t); }
        function setVariableInterval(callback,nextTimeCallback,startingTimeout){

            //don't set twice
            if(reconnectTimeout)
                return;

            var f=function(timeout){
                //console.log("Executing callback");
                callback();
                var delay=nextTimeCallback(timeout);
                console.log("Scheduling timeout for ",delay);
                reconnectTimeout=$timeout(f,delay, true, delay)
            };
            //initial timeout
            reconnectTimeout=$timeout(function(){
                f(startingTimeout);
            },startingTimeout, true, startingTimeout);
        }

        function cancelVariableInterval(){
            if(reconnectTimeout)
                $timeout.cancel(reconnectTimeout);
            reconnectTimeout=null;
        }

        function numberOfUniqueTelevoters(list){
            var tvts=[];
            for(var i=0; i<list.length; i++){
                tvts[list[i].tvt_id]=1;
            }
            return Object.keys(tvts).length;
        }

        function _reconnect(){
            console.log("Opening WS");
            ws = new WebSocket(WEBSOCKETURL);
            ws.onopen = function () {
                console.log("ws connected");
                cancelVariableInterval();
            };
            ws.onclose = function(){
                console.error("ws closed");//
                //start thread to retry periodically to reconnect
                //skip if interval already set
                cancelVariableInterval()
                setVariableInterval(_reconnect,function(t){
                    if(t<120)
                        return t*1.5;
                    return 120; //
                },1000);
                //reconnectInterval = $interval(function(){
                //    //try to reconnect
                //    _reconnect();
                //},1000);
            };
            ws.onmessage = function (message) {
                var data = JSON.parse(message.data);
                // console.log("on_message", data.channel);
                switch (data.channel) {
                    case 'tvt_list_update':

                        var vr = data.data;
                        var tvt_list = vr.list;
                        var max_id = vr.max_id;
                        // $scope.vote_summary= []; // this will be filled in by _process_votes_data
                        $scope.voters.data = _process_votes_data(tvt_list);//data.data;
                        $scope.num_voters = tvt_list.length;
                        $scope.num_cards = tvt_list.length;
                        $scope.num_tvts = numberOfUniqueTelevoters(tvt_list);
                        //calcualte numebr of unique televoters
                        //console.log('votes',data.data);
                        update_votes_grid(tvt_list, max_id);
                        $rootScope.$emit('NEW_TVT_LIST',tvt_list, max_id);
                        // update_admission_grid(data.data);
                        _update_votes_stat();
                        //console.timeEnd('render');
                        // console.log($scope.vote_summary)
                        break;
                    case 'votation_change':
                        var mode = data.data.state;
                        var v = data.data.votation;
                        if(mode=='open'){
                            //set data on UI
                            _openVotation(v)
                        }else{
                            _closeVotation(v, mode == 'force')
                        }
                        break;
                    case 'logs':
                        var msg=data.data.msg;
                        var pcb=data.data.pcb;
                        var severity= data.data.severity.toUpperCase();
                        alertify.error(severity+":"+msg+" on pcb "+pcb)
                        //add to logs
                        _add_log(msg,severity, pcb);
                        break;
                    case 'syc_status':
                        // console.log("syc_status", data.data);
                        // console.log("Voting mode",data.data.status.voting);
                        $scope.running = data.data.status.syc == true;
                        stateService.running = $scope.running;
                        $scope.vote_mode = data.data.status.voting ;
                        $scope.elapsed = data.data.status.vote_elapsed;
                        $scope.mini_elapsed = Date.now()
                        $scope.vote_confirmed = data.data.status.vote_confirmed;
                        $scope.vote_confirmed_vip = data.data.status.vote_confirmed_vip;

                        //get default data
                        var config = stateService.config;
                        config.configured = data.data.status.configured;
                        //now merge in data received from code
                        // console.log("in config/stateservive.config vote_config,vo, premerge",config.vote_config.votation_opened)
                        if ('vote_system' in data.data)
                            config.vote_system = stateService.mergeArray(config.vote_system, data.data.vote_system);
                        if ('setup' in data.data)
                            config.setup = stateService.mergeArray(config.setup, data.data.setup);
                        if ('easyradio' in data.data)
                            config.easyradio = stateService.mergeArray(config.easyradio, data.data.easyradio);
                        if ('meeting' in data.data)
                            config.meeting = stateService.mergeArray(config.meeting, data.data.meeting);
                        if ('vote_config' in data.data) {
                            config.vote_config = stateService.mergeArray(config.vote_config, data.data.vote_config);
                            //expand certaing fields. These array must be expanded in lists.. cannot do this server side because I don't
                            //know how may values I can have, at the moment..
                            config.vote_config['disable_buttons'] = stateService.expandListInSelectedKeys(config.vote_config['disable_buttons'])
                            config.vote_config['hide_texts'] = stateService.expandListInSelectedKeys(config.vote_config['hide_texts'])
                        }
                        if('status' in data.data && 'vote_config' in data.data.status){
                            config.vote_config = stateService.mergeArray(config.vote_config, data.data.status.vote_config);

                        }
                        if('emulator' in data.data) {
                            config.emulator = stateService.mergeArray(config.emulator, data.data.emulator)
                            $scope.emulation_state = data.data.emulator.state;
                        }
                        if('log' in data.data)
                            config.log = stateService.mergeArray(config.log, data.data.log)
                        if('version' in data.data)
                            config.version = stateService.mergeArray(config.version, data.data.version)
                        if('ui' in data.data)
                            config.ui = stateService.mergeArray(config.ui, data.data.ui)

                        // console.log("VO in config.voteconfig",config.vote_config.votation_opened);
                        // console.log("VO in d.d.s.voteconfig",data.data.status.vote_config.votation_opened);

                        //now update
                        stateService.config=config;

                        _startVotationTimer()

                        var pcbase = [];
                        var pcBaseUpdated = false;
                        // pcbase configuration
                        if ('pcbases' in data.data) {
                            console.log("pcbases", data.data.pcbases);
                            pcbase = data.data.pcbases;//should be an array
                            stateService.pcbases = pcbase;
                            pcBaseUpdated = true;
                        }

                        // state of running pcbase, merges with data found with "pcbase" message above
                        if('pcbases' in data.data.status){
                            //console.log("pcbase", data.data.status.pcbase);

                            var pcbasestatus = data.data.status.pcbases;
                            //stateService.pcbases = pcbasestatus;

                            //now associate, look for correct id
                            for(var i=0;i<stateService.pcbases.length;i++){
                                pcBaseUpdated = true;

                                var pcb=stateService.pcbases[i];
                                //search for correct status

                                var pcbs=pcbasestatus[i];
                                if(!pcbs){
                                    //first apply default values
                                    for (var key in stateService.defaultBSstatus) {
                                        if (stateService.defaultBSstatus.hasOwnProperty(key) && key!='index') {
                                            pcb[key] = stateService.defaultBSstatus[key];
                                        }
                                    }
                                    continue;
                                }

                                //found!
                                for (var key in pcbs) {
                                    if (pcbs.hasOwnProperty(key) && key!='index') {
                                        pcb[key] = pcbs[key];
                                    }
                                }
                            }
                        }
                        //now store
                        //$sessionStorage.config = config;
                        //$sessionStorage.pcbase = pcbase;
                        $rootScope.$emit('DATA_UPDATED');
                        if(pcBaseUpdated)
                            $rootScope.$emit('PCBASES_UPDATED');

                        $loading.finish('config')

                        //always call this inside a callback
                        $scope.$apply();
                        break;
                }
            };
        }

        // just for debug
        function sleepFor( sleepDuration ){
            var now = new Date().getTime();
            while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
        }


        _reconnect();

        function _add_log(msg, severity, pcb){
            var ms=new Date() ;
            var ts=ms.getDate()+'/'+ms.getMonth()+" "+_prePadZeroTo(ms.getHours(),2)+":"+
                _prePadZeroTo( ms.getMinutes(),2)+":"+_prePadZeroTo( ms.getSeconds(),2)+"."+_prePadZeroTo(ms.getMilliseconds(),3);
            var log={
                msg:msg,
                pcb:pcb,
                severity: severity,
                timestamp: ts
            };
            stateService.logs.push(log);
            //emit
            $scope.$emit('new_log');
        }

        function _prePadZeroTo(value, length){
            var str=value+"";
            if(str.length<length){
                for(var i=0;i<length-str.length;i++){
                    str="0"+str;
                }
            }
            return str;
        }

        /** FILTER **/
        $scope.doFilter = function() {
            console.log("Filter is ",$scope.filter.value );
            $scope.gridApi.grid.refresh();
            $('#votetabletab').tab('show');
        };

        $scope.singleFilter = function( renderableRows ){
            // var matcher = new RegExp($scope.filter.value,"ig");
            var filterString = $scope.filter.value ? $scope.filter.value.toLowerCase() : "";
            renderableRows.forEach( function( row ) {
                var match = false;
                [ 'name', 'card_id'].forEach(function( field ){
                    val =row.entity[field]+"";
                    val = val.toLowerCase();
                    // if(matcher.test(val)){
                    if(val.includes(filterString)){
                   // if ( row.entity[field].match(matcher) ){
                        match = true;
                    }
                });
                if ( !match ){
                    row.visible = false;
                }
            });
            return renderableRows;
        };



        function _reset_votation_stats(){
            narrow=80;
            wide=200;
            $scope.voters = {
                rowTemplate:'/static/partials/votersGridRow.html',
                onRegisterApi: function(gridApi){
                    $scope.gridApi = gridApi;
                    $scope.gridApi.grid.registerRowsProcessor( $scope.singleFilter, 200 );
                },
                flatEntityAccess:true,
                gridMenuShowHideColumns:false,
                enableFiltering:false,
                columnDefs:[
                    {name:'name', minWidth:wide},
                    {name:'vip',enableFiltering:false, maxWidth:narrow},
                    {name:'card_id', type:'number'},
                    {name:'tvt_id',displayName:"Tvt", type:'number'},
                    {name:'votes',enableFiltering:false, type:'number'},
                    {name:'vote_h',displayName:'Vote',enableFiltering:false},
                    {name:'votestatus_h',displayName:"vStatus",enableFiltering:false, maxWidth:narrow},
                    {name:'vote_enabled',enableFiltering:false, maxWidth:narrow},
                    {name:'freezed',enableFiltering:false, maxWidth:narrow},
                    {name:'locked',enableFiltering:false, maxWidth:narrow},
                    {name:'nack',enableFiltering:false, maxWidth:narrow},
                ]
            };
            $scope.num_voters = 0;

            $scope.perc_voters = 0;
            $scope.perc_vip_voters =0 ;
            $scope.perc_nonvip_voters = 0;

            $scope.votation_descr='';
            $scope.votation_time=0;
            $scope.votation_timer=null;
            $scope.start_votation_time = 0;
            $scope.voters_vip=[];
            $scope.voters_nonvip=[];

            for(var i=0;i<3;i++){
                $scope.voters_vip[i]='';
                $scope.voters_nonvip[i]='';
            }
        }

        $scope.voti = [];
        $scope.running = false;
        $scope.vote_mode = constants.VoteMode.POLL;
        _reset_votation_stats();

        $scope.emulation_state = false;

        // facciamo una griglia di quadrati 10x10
        // quindi una canvas 800x1250
        var square_size = 10;
        var squares_per_row = 70; //800 / square_size;

        function _process_votes_data(votes){
            var vs=[];
            var base_channels=[];
            // fill in base channel hash map
            stateService.pcbases.forEach(function(pcb){
                base_channels[pcb.index] = pcb.channel;
            });
            //in parallel fill also vote_summary
            var vote_summary = {};
            votes.forEach(function(element){
                if(element['admstatus'] == 'D')
                    return;

                var channel = base_channels[element['base']]
                if(!channel){
                    channel='PM';
                }
                v = constants.VoteHumanReadable[element['vote']];
                element['vote_h']= v != undefined ? v : element['vote'];
                element['votestatus_h'] = constants.VoteStatusHumanReadable[element['votestatus']];
                // add base channel stateService.pcbases[i];
                element['channel'] = channel;
                vs.push(element);

                if((element['votestatus'] == constants.VoteStatus.VALIDATED ||
                    element['votestatus'] == constants.VoteStatus.PRE_VOTE ) && element['vote']>0){
                    //vote
                    var v = element['vote'];
                    var w = element['votes'];
                    var vkey = "key"+v;
                    var vsm= vote_summary[vkey];
                    if(!vsm){
                        vsm = {
                            vote_type: v,
                            number: 1,
                            weight: parseFloat(w)
                        };
                        vote_summary[vkey] = vsm;
                    }else{
                        vsm.number += 1;
                        vsm.weight += parseFloat(w)
                    }

                    //votes -> weight
                }
            });
            $scope.vote_summary = vote_summary;
            return vs;
        }

        //update votation data on canvas grid
        var update_votes_grid = function (voti, max_id) {

            grid.updateGrid(voti, max_id, true, 'canvas',function(element){
                vote = element.vote;
                valid = (element.votestatus == constants.VoteStatus.VALIDATED || element.votestatus == constants.VoteStatus.CONFIRMED ||
                            element.votestatus == constants.VoteStatus.PRE_VOTE);
                color = constants.VoteColor[vote] != undefined ?
                    constants.VoteColor[vote] : constants.VoteColor[constants.Vote.OTHER];
                if(valid)
                    return color[0];
                return color[1];
            });
        };

        function _update_votes_stat(){
            var nv=0;
            var nv_vip=0;
            var nv_nonvip=0;
            var tv_vip=0; //total ov vip voters
            var col_vip=0;
            var col_nonvip=0;
            //it's split up in three columns, that's why there are 3 arrays
            for(var i=0;i<3;i++){
                $scope.voters_vip[i]='';
                $scope.voters_nonvip[i]='';
            }
            for(var i=0;i<$scope.voters.data.length;i++){
                vote=$scope.voters.data[i];
                if(vote.vote>0){
                    nv++;
                    var votation_data=vote.name+' '+vote.card_id+' <strong>'+constants.VoteHumanReadable[vote.vote]+"</strong>";
                    votation_data += ' '+constants.VoteStatusHumanReadable[vote.votestatus];
                    switch(vote.vote){
                        case constants.Vote.YES:
                            votation_data='<span class="text-green">'+votation_data+'</span>';
                            break;
                        case constants.Vote.ABS:
                            votation_data='<span class="text-light-blue">'+votation_data+'</span>';
                            break;
                        case constants.Vote.NO:
                            votation_data='<span class="text-red">'+votation_data+'</span>';
                            break;
                        default:
                            votation_data='<span class="text-orange">'+votation_data+'</span>';
                            break;
                    }
                    if(vote.vip) {
                        nv_vip++;
                        $scope.voters_vip[col_vip]=$scope.voters_vip[col_vip]+votation_data+'<br />';
                        $scope.voters_vip[col_vip]=$sce.trustAsHtml($scope.voters_vip[col_vip]);
                        col_vip=(col_vip+1)%3
                    }
                    else {
                        nv_nonvip++;
                        $scope.voters_nonvip[col_nonvip]=$scope.voters_nonvip[col_nonvip]+votation_data+'<br />';
                        $scope.voters_nonvip[col_nonvip]=$sce.trustAsHtml($scope.voters_nonvip[col_nonvip]);
                        col_nonvip=(col_nonvip+1)%3
                    }
                }
                if(vote.vip){
                    tv_vip++;
                }
            }
            //now do percs
            $scope.num_voters=$scope.voters.data.length;
            $scope.perc_voters =nv *100/  $scope.num_voters;
            $scope.perc_vip_voters =nv_vip *100/ tv_vip ;
            $scope.perc_nonvip_voters = nv_nonvip * 100 / ($scope.num_voters - tv_vip);
        }

        $scope.has_active_bases = function () {
            var active = false;
            stateService.pcbases.forEach(function(pcb){
                if(pcb.status=='a'){
                    active = true;
                    return false;
                }
            });
            return active;
        };

        $scope.shutdown = function () {

            var opts={};
            var e=$('#popupModal');
            $rootScope.context_dialog={
                title:'WARNING!',
                label:'type "stop" to confirm',
                value:'',
                is_input:true,
                callback:function(value){
                    if(value!='stop'){
                        console.log("ignoring stop")
                    }
                    console.log("Shutting down",value);
                    EasyradioApi.shutdownServer('kujvyhb,kj98').then(function(data){
                        alertify.success("Server will shut down. Hopefully");
                        console.log(data)
                        $timeout(function(){
                            alertify.success("Reloading. Let'see if server is up");

                            $window.location.reload();
                        },6000);
                    },function(err){
                        if(err)
                            alertify.error(err)
                        else
                            alertify.warning("Shutdown done but server quit before end of HTTP handshake. Maybe..")
                    });
                },
            };
            e.modal(opts)
        }

        $rootScope.clickDialogOk = function(){
            //evt.stopPropagation();
            console.log( ') triggered', $rootScope.context_dialog.value);
            //$rootScope.context_dialog.counter+= 1 ;
            $('#popupModal').modal('hide');
            $rootScope.context_dialog.callback($rootScope.context_dialog.value, $rootScope.context_dialog.params);
        };

        $scope.aggiorna = function () {
            $scope.startStopping= true;
            $loading.start('startStopping');
            if (!$scope.running)
                EasyradioApi.start().then(function(){
                    $scope.startStopping=false;
                    $loading.finish('startStopping');
                    alertify.success("BSs started")
                },function(err){
                    $scope.startStopping=false;
                    $loading.finish('startStopping');

                    console.log("Error starting server",err);
                    if(err.data && err.data.errorCode ==31 ){
                        //server already started.. simulate  a start..
                        alertify.success("Server already started!");
                        _reconnect();
                    }else{
                        alertify.error("Error starting BSs: check address of pcbases or network status",err);
                    }
                });
            else
                EasyradioApi.stop().then(function(){
                    $scope.startStopping=false;
                    $loading.finish('startStopping');
                    alertify.success("BSs stopped")
                },function(err){
                    $scope.startStopping=false;
                    $loading.finish('startStopping');

                    console.log("Error stopping server",err);
                    alertify.error("Error stopping BSs ",err)
                });
        };

        //OPEN / CLOSE voto
        $scope.aggiorna_voto = function (vote_config) {
            // now it's just open or close
            // close can be normal close or force close
            if (!$scope.running)
                return;

            vc =vote_config;
            // vc = stateService.config.vote_config;

            if ($scope.vote_mode==constants.VoteMode.VOTE) {
                //close vote..
                EasyradioApi.closeVote({
                    'votationId': vc.votation_id,
                    'resprog': vc.votation_resolution_counter,
                    'force': $scope.vc.vote_close_force
                }).then(function () {
                    //SYC emits a votation_change message. Everything is done in _closeVote()
                    alertify.success("Close command sent");

                }, function (err) {
                    console.error("Can't close vote", err);
                    alertify.error("Can't close vote: "+err.data.errorDescription);
                });
            } else {
                //open vote
                var votation_settings =  vc; // stateService.config.vote_config;
                var mode = votation_settings.votation_type;
                var extra_params = votation_settings.extra_params;
                if(extra_params=="{}")
                    extra_params = {}

                var open_vote_data = {
                    'votationId': votation_settings.votation_id,
                    'votationType': mode,
                    'backupText':votation_settings.votation_name,
                    'resprog': votation_settings.votation_resolution_counter,
                    'timeout': votation_settings.votation_timeout ? votation_settings.votation_timeout / 10 : 0,
                    'prepare': false,
                    'isFake':votation_settings.is_fake,
                    'fakeVoteAnswerKind':votation_settings.fake_answer_kind,
                    'fakeVoteAnswerTime':votation_settings.fake_answer_time,
                    // 'displayLight': votation_settings.light_on,
                    // 'isAnonymous': stateService.config.vote_system.anonymous_vote
                    'disabledButtons': _getSelectedKeys(votation_settings.disable_buttons),
                    'hiddenTexts': _getSelectedKeys(votation_settings.hide_texts),
                    'extraParams': JSON.stringify(extra_params),
                    'force':votation_settings.force,
                };


                EasyradioApi.openVote(open_vote_data).then(function () {
                    //start updating stats..
                    //syc emits a votation_change message that gets handled by _openVotation. Everything is done there
                }, function (err) {
                    errstr= formatError(err.data);

                    console.error("Can't open vote", err, errstr);
                    alertify.error("Can't open vote: " + errstr);
                });
            }
        };


        function _getSelectedKeys(obj){
            var a=[];
            //now set to True only values set to true in first array
            for(i in obj){
                if(obj[i]==true)
                    a.push(i);
            }

            return a;
        }

        function _openVotation(votation){

            //if we have just opened, avoid slight race condition caused by APIs internal working..
            // the status holds an open votation AND after a few milliseconds, a votation change is issued..
            if( $scope.votation_timer &&  $scope.votation_time < 0.1)
                return;

            //called by System and API when vote is opened externally, not by GUI
            var votation_settings =    stateService.config.vote_config; //stateService.config.vote_config;

            votation_settings.votation_id = votation.votation_id;
            votation_settings.votation_type = votation.votation_type;
            votation_settings.votation_name = votation.votation_name;
            votation_settings.votation_resolution_counter = votation.current_resolution_counter;
            votation_settings.votation_timeout = votation.votation_timeout * 10;

            $scope.votation_number = votation_settings.votation_id;
            $scope.votation_descr =
                !votation_settings.votation_name  ?
                    ('Votation '+votation_settings.votation_id) : votation_settings.votation_name;
            //udpate UI
            $rootScope.$emit('DATA_UPDATED');
            $rootScope.$emit("VOTATION_CHANGED");
            alertify.success("Vote opened");
            console.log("Vote opened");
            $scope.vc.vote_close_force = false;
            //reset internal data, as well as timers..
            _reset_votation_stats();
            _startVotationTimer();
        }

        function _closeVotation(votation, force_){
            //called by System and API when vote is closed externally, not by GUI
            force = force_ || false;
            auto_open = true;
            _stopVotationTimer();
            alertify.success("Votation closed");
        }

        function _startVotationTimer(){

            if($scope.votation_timer){
                _stopVotationTimer();
            }
            if(!$scope.running || ! stateService.config.vote_config.votation_opened)
                return;

            $scope.start_votation_time = Date.now();
            // $scope.votation_time = 0;
            $scope.votation_timer=$interval(function(){
                if($scope.vote_mode == 'vote')
                    $scope.votation_time =   $scope.elapsed + (Date.now() - $scope.mini_elapsed)/1000;
                else
                    $scope.votation_time =   $scope.elapsed
            },100);
        }

        function _stopVotationTimer(){
            if ($scope.votation_timer)
                $interval.cancel($scope.votation_timer);
            $scope.votation_timer = null;
            // $scope.votation_time = null
        }

        $scope.set_emulation = function(emulation_state){
            console.log("Going in emulation mode? ",emulation_state)
            //do something
            EasyradioApi.setEmulatorState(emulation_state).then(function () {
                //start updating stats..
                _reset_votation_stats();
                alertify.success("Changed emulator state!")
            }, function (err) {
                console.error("Can't change emulator", err);
                alertify.error("Can't change emulator state: "+err);
            });
            //then
        };

        $scope.aggiungi_utenti_fake = function () {
            $http({
                'url': '/tvt/addalldb',
                'method': 'GET',
                'cache': false
            }).then(function(success){
                console.log(success)
                alertify.success("Added "+success.data.result.admitted+" users with "+success.data.result.televoters+" televoters");
            },function(err){
                alertify.error("Unable to add users. Maybe you need to start server?")
            });
        };

        $scope.handleCanvasVoteMove = function(event){

            grid.handleCanvasMove(event,'canvasVoteElement', function(t){
                return 'Card Id:'+t.card.card_id+"<br />  "+t.card.name+"<br />vote: "+constants.VoteHumanReadable[t.card.vote]
                    +' '+constants.VoteStatusHumanReadable[t.card.votestatus];
            });
        };
    });
