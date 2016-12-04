
angular.module('easyradio').factory('stateService', function() {


    function _defaultOption(opts) {
        val = null;
        opts.forEach(function (o) {
            if (o._default && !val) {
                val = o.value;
            }
        });
        return val;
    }

    var configured = false;

    var voteModesAGM =    [
        {value: 'N', label:'Standard', _default: true},
        {value: 'Y', label:'Yes/No'},
        {value: 'J', label:'Group: Joined'},
        {value: 'S', label:'Group: Splitted'},
        {value: 'M', label:'Multi Choice'},
        {value: 'L', label:'List'},
        {value: 'V', label:'Value'}, 
    ];

    var voteModesConvention=[
        {value:'N', label:'Normal', _default: true},
        {value:'M', label:'Multivoto'},
        {value:'X', label:'XY Values'},
        {value:'9', label:'0..99 Values'},

    ]

    var listKeys=[
        {value:1,label:'1',_default:true},
        {value:2,label:'2'},
        {value:3,label:'3'},
        {value:4,label:'4'},
        {value:5,label:'5'},
        {value:6,label:'6'},
        {value:7,label:'7'},
    ];

    var conventionKeysList=[
        {value:2,label:'(1,2)',_default:true},
        {value:3,label:'(1,2,3)'},
        {value:4,label:'(1,2,3,4)'},
        {value:5,label:'(1,2,3,4,5)'},
    ];

    var listStrTypes=[
        {value:0,label:'List', _default:true},
        {value:2,label:'Proposal'},
        {value:4,label:'Candidate'},
        {value:6,label:'Opinion'},
        // {value:4,label:'to be defined'},
    ];


    var extraParamsForVotationKind={
        'N':[],
        'Y':[],
        'J':[   // Group Joined
            { name:'group_id',label:'Group Id',type:'int', defvalue:1},
            { name:'min_for',label:'Min For',type:'int', defvalue:1},
            { name:'max_for',label:'Max For',type:'int', defvalue:1},
        ],
        'S':[  // Group // Splitted
            { name:'group_id',label:'Group Id',type:'int', defvalue:1},
            { name:'dont_reset',label:'Do not reset',type:'bool', defvalue:false},
            { name:'allvotes_valid',label:'All votes valid',type:'bool', defvalue:true},
            { name:'current_weight',label:'Current weight',type:'int', defvalue:1},
            { name:'max_for',label:'Max For',type:'int', defvalue:1},
        ],
        'M':[  // Multi choice
            { name:'max_choices',label:'Max available values',type:'int', defvalue:1},
            { name:'min_valid',label:'Min valid choices',type:'int', defvalue:1},
            { name:'max_valid',label:'Max valid choices',type:'int', defvalue:1},
            { name:'allchoices_selected',label:'All choices available must be selected',type:'bool'},
            { name:'store_order',label:'Store order of choices',type:'bool', defvalue:true},
            { name:'label',label:'Select label',type:'list', values:listStrTypes, defvalue:0},
        ],
        'L':[  // List
            { name:'max_lists',label:'Max available lists',type:'int'},
            { name:'label',label:'Select label',type:'list', values:listStrTypes},
        ],
        'V':[  // Value
            { name:'max',label:'Max Value',type:'int'},
        ],

    }


    var meetingTypes = [
        {value:0, label:'AGM', _default:true},
        {value:1, label:'Convention'}
    ];

    var meeting = {
        type:_defaultOption(meetingTypes),
        id:null,
    };

    var easyradio = {
        standalone:false,
        easyvote_url:null
    };

    var version = {
        version:'vvvvv',
        build:'bbbb'
    }

    var ui={

    }

    var vote_config = {
        'votation_id': 0,
        'votation_name': '',
        votation_type: _defaultOption(voteModesAGM),
        'votation_resolution_counter': 0,
        'votation_timeout': 0,
        'light_on': false,
        'is_fake':false,
        'fake_answer_time':false,
        'fake_answer_kind':'F',
        'disable_buttons':[],
        'hide_texts':[],

        'extra_params':{},

        'group_num_choices': 0,
        'group_tot_choices': 0,
        'group_reset_at_start': false,
        'group_all_votes_valid': false,
        'group_enable_yes': false,
        'group_enable_no': false,
        'group_enable_abs': false,

        'list_enabled_keys': [],
        'list_string_type': _defaultOption(listStrTypes),

        convention_auto_valid : false,
        convention_meeting_emulation: false,
        convention_enabled_keys : false,

        convention_collect_all_votes :false,
        convention_max_value : 0,
        convention_max_multivote : 0,
        convention_enable_no_2all_and_abs2all : false,
        convention_all_yes : false
    };

    //now give options
    var trackingModes = [
        {value: 'S', label: 'Static', _default: true},
        {value: 'D', label: 'Dynamic'}
    ];
    var setup = {
        tracking_mode: _defaultOption(trackingModes),
        poll_time: 0,
        pcbase_timeout: 0,
        // tx_enable_per_sec: 0,
    };


    var confirmInVotes = [
        {value: 'N', label: 'None', _default: true},
        {value: 'V', label: 'VIP'},
        {value: 'A', label: 'All'}
    ];
    var confirmInPolls = [
        {value: 'N', label: 'None' },
        {value: 'V', label: 'VIP', _default: true},
        {value: 'VC', label: 'VIP (collected)'},
        {value: 'A', label: 'All'},
        {value: 'AC', label: 'All (collected)'}
    ];
    // var voteSaveModes = [
    //     {value: 'i', label: 'Incremental', _default: true},
    //     {value: 'n', label: 'Normal'}
    // ];

    var vote_system = {

        confirm_in_vote:  _defaultOption(confirmInVotes),
        confirm_in_poll: _defaultOption(confirmInPolls),
        televoter_check: true,
        periodic_broadcast: false,
        anonymous_vote: false,
        // dynamic_affiliation: false,
        auto_enable_disable: false,
        // boost_vote_collection: false,
        //vote_save_mode: _defaultOption(voteSaveModes)
    };

    var emulator = {
        state: false,
    }
    
    var log = {
        admission_folder: '',
        voting_folder:''
    }

    //console.log("VOTE SYSTEM IS",voteSystem)

    var defaultBSstatus={
        base_status:-1,
        battery_charge:0,
        bs_freqs:[],
        build_version:0,
        host:'',
        index:-1,
        major_version:0,
        pcbase_status:-1,
        port:0,
        power_supply:-1,
        serial_status:-1,
        voting_mode:-1
    };

    var logs=[];

    return {
        configured: configured,
        running: false,
        pcbases:[],
        config: {
            'vote_system': vote_system,
            'setup': setup,
            'meeting': meeting,
            'easyradio': easyradio,
            'vote_config':vote_config,
            'emulator': emulator,
            'log': log,
            'version': version,
            'ui':ui,
        },
        //'voteSaveModes':voteSaveModes,
        'confirmInVotes':confirmInVotes,
        'confirmInPolls':confirmInPolls,
        'trackingModes':trackingModes,
        defaultBSstatus:defaultBSstatus,
        voteModesForMeetingType:{
            0:voteModesAGM,
            1:voteModesConvention
        },
        'listKeys':listKeys,
        listStrTypes: listStrTypes,
        meetingTypes:meetingTypes,
        conventionKeysList:conventionKeysList,
        extraParamsForVotationKind: extraParamsForVotationKind,
        logs:logs,
        defaultOption:function(list){
            return _defaultOption(list)
        },
        mergeArray:function(baseConfigData, newConfigData){
            //merge new array with the one provided, overwriting base values which share the same key
            // and return merged array
            for(attr in newConfigData)
                baseConfigData[attr] = newConfigData[attr];
            return baseConfigData;
        },
        expandListInSelectedKeys:function(list){
            var a={};
            for(l in list)
                a[list[l]]=true;
            return a;
        },
        ui_control_show:function(control_name){
            //look in ui
             for(var key in this.config.ui){
                v=this.config.ui[key]
                if ('controls' in v){
                    for(i=0;i<v.controls.length;i++){
                        c=v.controls[i]
                        if(c.name == control_name)
                            return !c.hidden;
                    }
                }
            }
            return true;
        }
    };
});
