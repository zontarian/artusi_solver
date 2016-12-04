/**
 * Created by walter on 12/09/16.
 */

angular.module('easyradio').factory('televoterMenu', function($rootScope, EasyradioApi) {


    var _menuItems =  [
        [
            {menu:'Add', func:'add'},
            {menu:'Add to all', func:'addToAll'},
            {menu:'Delete from all', func:'deleteFromAll', implemented:true}
        ]  ,
        [
            {menu:'Beep', func:'beep', implemented:true},
            {menu:'Brightness %', func:'brightness', implemented:true},
            {menu:'Message..',func:'message', implemented:true},
            {menu:'Term update',func:'termUpdate'},
            {menu:'VIP televoter',func:'vipToggle'},
        ]  ,
        // [
        //     {menu:'Change freq on own cluster', func:'changeFrequency,own'},
        //     {menu:'Change freq. on every cluster', func:'changeFrequency,all'},
        //     {menu:'Change Televoter Data...', func:'changeData'},
        // ],
        [
            {menu:'Freeze On (Enabled)', func:'freeze,on'},
            {menu:'Freeze Off (Disabled)', func:'freeze,off'},
            {menu:'End Freeze', func:'freeze,end'},

        ],
        [
            {menu:'Vote enabled', func: 'voteEnable,on'},
            {menu:'Vote disabled', func: 'voteEnable,off'},
            {menu:'Force open vote', func: 'forceOpenVote'},
            {menu:'Reset', func: 'reset'},
            {menu:'Unlock from meeting ID', func: 'unlockFromMeetingId'},

        ],
        [
            {menu:'Shutdown', func: 'shutdown'},
        ]

    ];


    var _menuFunc = function( string, tel){
        //spit
        console.log("Menu Func ")

        var televoter = tel || this.entity();

        console.log("Televoter ",televoter);

        var res = string.split(",")
        var f = res[0];
        var args = res.splice(1)
        switch (f){
            case 'add':
                var opts={};
                var e=$('#popupModal');
                $rootScope.context_dialog={
                    title:'Add to base',
                    label:'base Id (int)',
                    value:'',
                    is_input:false,
                    callback:function(value){
                        console.log("Sending text");
                        EasyradioApi.add(televoter.card_id, parseInt(value));
                    },
                };
                e.modal(opts);
                break;
            case 'addToAll':
                EasyradioApi.addToAll(televoter.card_id);
                break;
            case 'deleteFromAll':
                var opts={};
                var e=$('#popupModal');
                $rootScope.context_dialog={
                    title:'Delete',
                    label:'delete this card id from televoters list?',
                    value:'',
                    is_input:false,
                    callback:function(value){
                        console.log("Deadmitting");
                        EasyradioApi.deleteFromAll(televoter.card_id);
                    },
                };
                e.modal(opts);

                break;
            case 'beep':
                EasyradioApi.simpleCommand(televoter.card_id, EasyradioApi.commands.BEEP)
                break;
            case 'brightness':
                var opts={};
                var e=$('#popupModal');
                $rootScope.context_dialog={
                    title:'Brightness',
                    label:'Set display brightness %(0-100) ',
                    value:'50',
                    is_input:true,
                    callback:function(value, params){
                        console.log("SEt brightness "+value);
                        EasyradioApi.simpleCommand(televoter.card_id, EasyradioApi.commands.DISPLAY_BRIGHTNESS, value);
                    },
                };
                e.modal(opts)
                //param can be 'on' or 'off'


                break;
            case 'message':
                var opts={};
                var e=$('#popupModal');
                $rootScope.context_dialog={
                    title:'Send message',
                    label:'Text to send (max 64 chars)',
                    value:'',
                    params:[
                        {label:'timeout',value:5}
                    ],
                    is_input:true,
                    callback:function(value, params){
                        console.log("Sending text");
                        EasyradioApi.sendText(televoter.card_id, value, params[0].value /* timeout */);
                    },
                };
                e.modal(opts)
                break;
            case 'termUpdate':
                break;
            case 'vipToggle':
                EasyradioApi.vipToggle(televoter.card_id, !televoter.vip);
                break;
            case 'changeFrequency':
                var param=args && args.length>0 ?  args[0] : 'all';
                //param can be 'all' or 'own'
                break;
            case 'changeData':
                var opts={};
                var e=$('#popupModal');
                $rootScope.context_dialog={
                    title:'Change data',
                    label:'text',
                    value:'',
                    is_input:true,
                    callback:function(value){
                        console.log("Sending text");
                        //EasyradioApi.sendText(televoter.card_id, value);
                    },
                };
                e.modal(opts)
                //$scope.$apply();
                break;
            case 'freeze':
                var param=args && args.length>0 ?  args[0] : 'end';
                //param can be 'on' or 'off' or 'end'
                if(param=='on')
                    EasyradioApi.simpleCommand(televoter.card_id, EasyradioApi.commands.FREEZE_ON);
                else if(param=='off')
                    EasyradioApi.simpleCommand(televoter.card_id, EasyradioApi.commands.FREEZE_OFF);
                else if(param=='end')
                    EasyradioApi.simpleCommand(televoter.card_id, EasyradioApi.commands.END_FREEZE);


                break;
            case 'voteEnable':
                var param=args && args.length>0 ?  args[0] : 'off';
                //param can be 'on' or 'off'
                if(param=='on')
                    EasyradioApi.simpleCommand(televoter.card_id, EasyradioApi.commands.VOTE_ENABLED);
                else if(param=='off')
                    EasyradioApi.simpleCommand(televoter.card_id, EasyradioApi.commands.VOTE_DISABLED);
                break;
            case 'forceOpenVote':
                EasyradioApi.simpleCommand(televoter.card_id, EasyradioApi.commands.FORCE_VOTE_OPEN);
                break;
            case 'reset':
                EasyradioApi.simpleCommand(televoter.card_id, EasyradioApi.commands.RESET);
                break;
            case 'unlockFromMeetingId':
                EasyradioApi.simpleCommand(televoter.card_id, EasyradioApi.commands.UNLOCK_FROM_MEETING_ID);
                break
            case 'shutdown':
                EasyradioApi.simpleCommand(televoter.card_id, EasyradioApi.commands.SHUTDOWN);

                break;
        }
    }

    return{
        menuItems:_menuItems,
        menuFunc:_menuFunc
    }
});