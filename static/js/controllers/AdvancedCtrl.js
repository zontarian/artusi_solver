/**
 * Created by walter on 08/12/15.
 */
angular.module('easyradio').controller('AdvancedCtrl', function ($rootScope, $scope, $http, $timeout, $q, EasyradioApi, stateService, formatError) {
    // all the items

    var LINE_LENGTH=16;
    //
    var config=stateService.config;  //$sessionStorage.config;

    $scope.meetingTypes = stateService.meetingTypes;

    //now give options
    $scope.trackingModes = stateService.trackingModes;

    $scope.confirmInVotes = stateService.confirmInVotes;
    $scope.confirmInPolls = stateService.confirmInPolls;
    // $scope.voteSaveModes = stateService.voteSaveModes;

    $scope.televoter = {
        name:null,
        id:null,
        bs:null,
        sh:null,
        vt:null,
        isVip:false,
        cardId:null,
    };

    $scope.ui_control_show = function(ctrlname){
        return stateService.ui_control_show(ctrlname);
    }

    var cmdCodes=EasyradioApi.commands;
    $scope.messageCodes = [
        {value: cmdCodes.BEEP, label: 'Beep', _default: true, _value: true},
        {value: cmdCodes.DISPLAY_BRIGHTNESS, label: 'Display Brightness %'},
        {value: cmdCodes.FREEZE_ON, label: 'Freeze On'},
        {value: cmdCodes.FREEZE_OFF, label: 'Freeze Off'},
        {value: cmdCodes.END_FREEZE, label: 'End Freeze'},
        {value: cmdCodes.VOTE_ENABLED, label: 'Vote Enabled'},
        {value: cmdCodes.VOTE_DISABLED, label: 'Vote Disabled'},
        {value: cmdCodes.FORCE_VOTE_OPEN, label: 'Force Open Vote'},
        {value: cmdCodes.ENABLED_AND_FORCE_OPEN_VOTE, label: 'Enabled and Force Open Vote'},
        {value: cmdCodes.RESET_AND_DISABLE_VOTE, label: 'Reset and Disable Vote'},
        {value: cmdCodes.CONFIRM_VOTE, label: 'Confirm Vote'},
        {value: cmdCodes.RESET, label: 'Reset'},
        {value: cmdCodes.UNLOCK_FROM_MEETING_ID, label: 'Unlock from Meeting ID'},
        {value: cmdCodes.READ_GROUP_CHOICES, label: 'Read Group Choices'},
        {value: cmdCodes.SET_GROUP_CHOICES, label: 'Set Group Choices', _value: true},
        {value: cmdCodes.SHUTDOWN, label: 'Shutdown'},
        {value: cmdCodes.ERASE_EPROM, label: 'Erase Eprom'},
        {value: cmdCodes.GO_MEETING_MODE, label: 'Go meeting Mode'},
        {value: cmdCodes.GO_CONVENTION_MODE, label: 'Go Convention Mode'}
    ];
    $scope.message = {
        cardId:null,
        broadcast:false,
        code:stateService.defaultOption($scope.messageCodes),
        timeValue:null,
        text:null,
    };

    //merge with config
    function init() {
        //config=$sessionStorage.config;
        config=stateService.config;

        $scope.easyradio = config.easyradio;
        $scope.meeting = config.meeting;
        $scope.setup = config.setup;
        $scope.vote_system = config.vote_system;
        $scope.vote_config = config.vote_config;

        $scope.pcbases = stateService.pcbases;
        if(!$scope.televoter.bs && $scope.pcbases.length>0){
            $scope.televoter.bs=$scope.pcbases[0].id;
        }
    }

    $rootScope.$on('DATA_UPDATED', function() {
        $scope.pcbases = stateService.pcbases;
        if(!$scope.televoter.bs && $scope.pcbases.length>0){
            $scope.televoter.bs=$scope.pcbases[0].id;
        };
    });

    //$timeout(function(){
    //setupUI();
    var elem=$('input.slider');
    console.log(elem)
    //init sliders
    $("input.slider").slider();

    $scope.$on('$loadingFinish', function(event, key){
        init();
    });
    if(config)
        init();


    /******
     * API commands
     */
    $scope.saveConfig = function(){

        //change button
        EasyradioApi.saveConfig($scope.easyradio, $scope.meeting, $scope.setup, $scope.vote_system, $scope.vote_config).then(function(){
            console.log("SETUP:",$scope.setup);
            console.log('VOTE SYSTEM:',$scope.vote_system);

            var config={
                setup: $scope.setup,
                vote_config: $scope.vote_config,
                meeting: $scope.meeting,
                vote_system: $scope.vote_system,
                easyradio: $scope.easyradio
            };
            //save in session
            //$sessionStorage.config=config;

            //reset form to its original status
            $scope.formconfig.$setPristine();
        })

    }

    $scope.canSaveConfig = function(){
        return $scope.formconfig.$dirty;
    }

    $scope.addTelevoter = function(){
        //use data in Telvoter struct
        var tvt = $scope.televoter;
        // EasyradioApi.add({'cardId': parseInt(tvt.id), 'name': tvt.name, 'shares': tvt.sh, 'votes': tvt.vt, 'isVip': tvt.isVip, 'languageId': 1, 'sequence': 0, 'pcbaseId': tvt.bs }).then(function () {
        EasyradioApi.add(tvt.cardId,tvt.bs).then(function () {
            alertify.success("Televoter added");

        }, function (err) {
            alertify.error("Televoter not added", err);
            console.error("Error adding televoter", err)
        });
    }

    $scope.sendMessage = function(){
        var msg = $scope.message;
        dest = msg.cardId;
        if(msg.broadcast)
            dest = 0
        EasyradioApi.sendSimpleMsg({
            'cardId': parseInt(dest),
            'command': parseInt(msg.code),
            'arg': msg.timeValue,
            'isBroadcast': msg.broadcast
        }).then(function () {
            alertify.success("message sent");
        }, function (err) {
            console.error("Error sending simple msg", err);
            errstr= formatError(err.data);
            alertify.error("Error sending command: "+errstr)
            if(err.data.errorCode==1){
                alertify.error("Unknown televoter with this ID");
            }
        });
    }

    $scope.sendText = function(){
        var msg = $scope.message;
        console.log("SEnd TEXT",$scope.message);
        // $scope.message.text1=_addTrailingSpaces($scope.message.text1);
        // $scope.message.text2=_addTrailingSpaces($scope.message.text2);
        // $scope.message.text3=_addTrailingSpaces($scope.message.text3);
        // $scope.message.text4=_addTrailingSpaces($scope.message.text4);
        var timeout = $scope.message.time;
        var text =  $scope.message.text;// $scope.message.text1 + $scope.message.text2 + $scope.message.text3 + $scope.message.text4;
        EasyradioApi.sendText(parseInt(msg.cardId),text, timeout).then(function () {
            alertify.success("text sent");
        }, function (err) {
            console.error("Error sending text msg", err)
            if(err.data.errorCode==1){
                alertify.error("Unkown televoter with this ID");
            }
        });
    }

    // $scope.alignText=function(align){
    //     if(align=='left'){
    //         //remove trailing and leading spaces
    //         $scope.message.text1 = $scope.message.text1 ? $scope.message.text1.trim() : "";
    //         $scope.message.text2 = $scope.message.text2 ? $scope.message.text2.trim() : "";
    //         $scope.message.text3 = $scope.message.text3 ? $scope.message.text3.trim() : "";
    //         $scope.message.text4 = $scope.message.text4 ? $scope.message.text4.trim() : "";
    //
    //
    //     }else if(align=='center'){
    //         $scope.message.text1 = _addLeadingSpaces($scope.message.text1,'center');
    //         $scope.message.text2 = _addLeadingSpaces($scope.message.text2,'center');
    //         $scope.message.text3 = _addLeadingSpaces($scope.message.text3,'center');
    //         $scope.message.text4 = _addLeadingSpaces($scope.message.text4,'center');
    //
    //     }else{
    //         //right
    //         $scope.message.text1 = _addLeadingSpaces($scope.message.text1,'right');
    //         $scope.message.text2 = _addLeadingSpaces($scope.message.text2,'right');
    //         $scope.message.text3 = _addLeadingSpaces($scope.message.text3,'right');
    //         $scope.message.text4 = _addLeadingSpaces($scope.message.text4,'right');
    //     }
    //
    // }

    function _addLeadingSpaces(str,just){
        if(!str)
            return "";

        str=str.trim();
        var spaces=LINE_LENGTH-str.length;
        if(just=='center')
            spaces=spaces/2;
        else if(just=='right')
            spaces=spaces;

        for(var i=0;i<spaces;i++){
            str=' '+str;
        }
        return str;
    }
    function _addTrailingSpaces(str){
        var spaces=LINE_LENGTH;
        if(str)
            spaces=LINE_LENGTH-str.length;
        else
            str=""

        for(var i=0;i<spaces;i++){
            str= str+' ';
        }
        return str;
    }

    $scope.debugData = function(){
        console.log("SETUP:",$scope.setup);
        console.log('VOTE SYSTEM:',$scope.vote_system);
        console.log('TELEVOTER:',$scope.televoter);
        console.log('MESSAGE:',$scope.message);
    }

});
