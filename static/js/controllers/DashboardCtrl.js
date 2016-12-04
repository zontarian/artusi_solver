/**
 * Created by walter on 14/12/15.
 */
angular.module('easyradio').controller('DashboardCtrl', function($rootScope, $scope, $http, $timeout, $q, EasyradioApi, $cookies, EasyvoteApi, stateService, contextMenu, hotkeys, focus, format, constants, televoterMenu, grid) {
    // all the items

    var config=stateService.config; //$sessionStorage.config;

    // $cookies.put('paola','ti amo');

    /*
    if status.voting == 'vote' => button[CLOSE]
    if status.voting == 'confirm' => button[CLOSE/CONFIRM]
    if status.voting == 'poll' => button[OPEN]
     */
    $scope.forms={};
    //scroll down list values
    $scope.voteModesForMeetingType = stateService.voteModesForMeetingType;
    $scope.strTypes= stateService.listStrTypes;
    $scope.listKeys = stateService.listKeys;
    $scope.config = config;
    $scope.conventionKeysList = stateService.conventionKeysList;
    $scope.extraParamsForVotationKind = stateService.extraParamsForVotationKind;

    $scope.fakeVoteModes = constants.FakeVoteAnswerTypes;
    $scope.buttonCodes=constants.ButtonCodes;
    $scope.textCodes=constants.TextCodes;
    //console.log("CONFIG MEETING",$scope.voteModesForMeetingType[$scope.config.meeting.type])
    //set default
    var votationModeChanged=false;
    $scope.extra_fields=[];

    //model
    //this BINDS the two data
    //$scope.vote_config = stateService.config.vote_config;
    $scope.vote_config = {}

    //test
    $scope.vote_config.test_check= true;

    $scope.vote_close_force = false;

    $scope.showuigrid = false;

    //votation list from EasyVote
    $scope.votationsFromApi=[];

    _oldVoteMode=null;
    function updateExtraFields(voteMode){
        $scope.extra_fields = $scope.extraParamsForVotationKind[voteMode];

        //UPDATE ONLY IF THERE is an extra form and if form is not dirty. Of course Do pupdate also
        //if user changed votation type, so fields gets reseted to dafaults
        if(_oldVoteMode == voteMode && (!$scope.forms.extraFields || $scope.forms.extraFields.$dirty))
            return;

        _oldVoteMode = voteMode;

        var f={}
        $scope.extra_fields.forEach(function(fld){
            var def=fld.defvalue || null;
            f[fld.name]=def;
        });
        $scope.vote_config.extra_params=f;//reset
    }

    function init(){
        //config=$sessionStorage.config;
        $scope.config = stateService.config;
        _syncDataWithState();

        if(!config.easyradio.standalone && config.easyradio.easyvote_url) {
            EasyvoteApi.getVotations(config.easyradio.easyvote_url).then(function (data) {
                console.log("API received data ", data);
                var vs = [];
                $scope.votationsFromApi = data;
                data.forEach(function (v) {
                    vs.push({value: v.id, label: v.title});
                });
                $scope.votations = vs;
                //$scope.$apply();
            }, function (err) {
                console.error("No votations!", err)
            });
        }
        updateExtraFields($scope.vote_config.votation_type);

        //bind keys
        hotkeys.bindTo($scope)
            .add({
                combo: 'f',
                description: 'Search in grid',
                callback: function(){
                     $timeout(function(){
                         $('#votetabletab').tab('show');
                         focus('focusSearch');
                     });

                }
            });
        //add handler for tab
        $('#votetabletab').on('shown.bs.tab', function (e) {
            //redraw UI Grid
            //$scope.showuigrid = true;
            console.log("Redraw UI Grid");
            // $scope.gridApi.core.notifyDataChange( uiGridConstants.dataChange.ROW );
            // $scope.gridApi.grid.refresh();
            $scope.gridApi.core.handleWindowResize();
        })
    };

    $scope.$on('$loadingFinish', function(event, key){
        init();
    });
    $rootScope.$on('DATA_UPDATED', function() {
        _syncDataWithState(true);
    });
    $rootScope.$on('VOTATION_CHANGED', function() {
        if($scope.forms.votationData)
            $scope.forms.votationData.$setPristine();

        if($scope.forms.extraFields)
            $scope.forms.extraFields.$setPristine();
    });


    if(config)
        init();

    $scope.$on("$destroy", function(){
        _syncStateWithData();
    });

    $scope.changeVoteMode=function(voteMode){
        console.log("Changed vote mode in ",voteMode);
        votationModeChanged = true;
        //update custom fields
        updateExtraFields(voteMode);
    }

    $scope.votationChanged=function(votation){
        console.log(votation);
        $scope.votationsFromApi.forEach(function(v){
            if(votation == v.id){
                $scope.vote_config.votation_name= v.title + " "+ v.id;
                $scope.vote_config.votation_timeout= v.id*100;//it's just an example
            }
        });
    };

    $scope.debugValues=function(){
        vc=[]
        vc['buttons']=_getSelectedKeys($scope.vote_config.disable_buttons );
        vc['hiddenTexts']= _getSelectedKeys($scope.vote_config.hide_texts );
        console.log("DEBUG Values",vc,$scope.vote_config);
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

    $scope.rightClick=function(event){
        var scope = angular.element(event.toElement).scope()
        console.log('got here',scope.rowRenderIndex);
        //contextMenu.cancelAll();
    };

    $scope.voteTypeHuman=function(voteType){
        var arr = $scope.voteModesForMeetingType[$scope.config.meeting.type];
        for(i in arr){
            if(arr[i].value == voteType)
                return arr[i].label;
        }
        return "still unknown"
    }

    $scope.freezeInput= function(){
        return $scope.vote_mode!=constants.VoteMode.POLL;
    }


    function _syncLocalIfNotNull(key, vote_config, force){
        var force = force || false;
        if(!$scope.vote_config[key] || force)
            $scope.vote_config[key]=vote_config[key];
    }

    function _syncLocalArrayIfNotNull(key, vote_config, force){
        var force = force || false;

        if(!$scope.vote_config[key] || $scope.vote_config[key].length==0 || force)
            $scope.vote_config[key]=vote_config[key];
    }

    function _syncLocalArrayIfNotNullV2(key, vote_config, force){

        var force = force || false;

        //count if there is something selected in vote config
        list=$scope.vote_config[key];
        selected=false;

        if(list && list.length>0){
            //count
            for(i in list){
                if(list[i]==true){
                    selected=true;
                    break;
                }
            }
        }
        if(!selected || force)
            $scope.vote_config[key]=vote_config[key];
    }

    function _syncDataWithState(force){
        var force = force || false;
        var vote_config=stateService.config.vote_config;
        //don't update values if no data or if in freezingMode (i.e. votation is open)
        //function 'freezInput' must be defined prior to evaluating if.. so test for existence before calling it
        if(!vote_config || (!force && $scope.freezeInput && $scope.freezeInput()) ||  ($scope.forms.votationData && $scope.forms.votationData.$dirty))
            return;

        _syncLocalIfNotNull('votation_id', vote_config, force);
        _syncLocalIfNotNull('votation_name', vote_config, force);
        _syncLocalIfNotNull('votation_type', vote_config, force);
        _syncLocalIfNotNull('is_fake',vote_config, force);
        _syncLocalIfNotNull('fake_answer_time',vote_config, force);
        _syncLocalIfNotNull('fake_answer_kind',vote_config, force);

        _syncLocalIfNotNull('votation_resolution_counter', vote_config, force);
        _syncLocalIfNotNull('votation_timeout', vote_config, force);
        _syncLocalIfNotNull('light_on', vote_config, force);

        _syncLocalArrayIfNotNullV2('disable_buttons', vote_config,5, force);
        _syncLocalArrayIfNotNullV2('hide_texts', vote_config, 3, force);

        _syncLocalArrayIfNotNull('list_enabled_keys', vote_config, force);
        _syncLocalArrayIfNotNull('convention_enabled_keys', vote_config, force);
    }

    function _syncStateWithData(){

        stateService.config.vote_config = $scope.vote_config;
    }

    $scope.rc = {
        entity: function(){
            return grid.getCurrentTelevoter();
        },
        menuItems: function(){
            return televoterMenu.menuItems;
        },
        menuFunc: televoterMenu.menuFunc
    }

});
var idx=0;
angular.module('easyradio').controller('RowController', function($rootScope, $scope , EasyradioApi, televoterMenu) {
    // all the items

    this.entity = function(){
        var row=_climbParents($scope,'row',0,10);
        //console.log("Entity is ",row.entity)
        return row.entity;
    }

    this.getMenuOffset = function(){
        var viewport=$('.ui-grid-viewport');

        if (viewport && viewport.offset()) {
            vp_off = viewport.offset();
            return {
                x:vp_off.left,
                y:vp_off.top,
                h:20
            }
        }
    }

    function _climbParents(root,attr,depth,max_depth){
        if(root[attr])
            return root[attr];
        if(depth>=max_depth || !root['$parent'])
            return null;

        return _climbParents(root.$parent,attr,depth+1,max_depth);
    }

    this.menuItems= function(){
        //return _menuItems;
        return televoterMenu.menuItems;
    };

    this.menuFunc = televoterMenu.menuFunc;

    //$('#context-dialog-ok').on('click', function(evt) {
    $rootScope.clickDialogOk = function(){
        //evt.stopPropagation();
        console.log( ') triggered', $rootScope.context_dialog.value);
        //$rootScope.context_dialog.counter+= 1 ;
        $('#popupModal').modal('hide');
        $rootScope.context_dialog.callback($rootScope.context_dialog.value, $rootScope.context_dialog.params);
    };



});
