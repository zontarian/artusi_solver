angular.module('easyradio').factory('constants', function() {

    var VoteValues= {
        NONE:0x00,
        YES : 0x83, //131
        NO : 0x8c,  //140
        ABS : 0xb0, //176
        OTHER: -1,
    };
    var VoteStatusValues={
        NONE : 0xff ,
        PRESSED :0xdf    ,
        VALIDATED : 0x5f  ,
        CONFIRMED : 0x1f  ,
        PRE_VOTE : 0xfb   ,
    };
    var AdmissionValue={
        OUTSIDE: 'D',
        ADMISSION_IN_PROGRESS: 'P',
        ENTERED: 'E',
        TEMPORARY_EXIT: 'X',
        TRANS_ADM_ENTER: 'PE',
        TRANS_OUT_ADM: 'DP',
    }
    var _VoteColors={} //tuple, not validated and validated
    _VoteColors[VoteValues.NONE]=["#FFF","#FFF"];
    _VoteColors[VoteValues.YES]=["#0F0","#7fff7f"];
    _VoteColors[VoteValues.NO]=["#F00","#ff7f7f"];
    _VoteColors[VoteValues.ABS]=["#FF0","#FFFF7F"];
    _VoteColors[VoteValues.OTHER]=["#AAA","#FFF"];
    _VoteColors[0]=["#FC00FF","#FD77FF"];  //fuchsia
    _VoteColors[1]=["#003","#7F7F99"];    //dark blue
    _VoteColors[2]=["#006","#7F7FC2"];
    _VoteColors[3]=["#009","#7F7FE6"];
    _VoteColors[4]=["#00C","#7F7FFA"];
    _VoteColors[5]=["#00F","#7F7FFF"];    // bright pure blue

    var _VoteHumans={}
    _VoteHumans[VoteValues.NONE]="-";
    _VoteHumans[VoteValues.YES]="YES";
    _VoteHumans[VoteValues.NO]="NO";
    _VoteHumans[VoteValues.ABS]="abs";
    _VoteHumans[VoteValues.OTHER]="?";

    var _VoteStatusHumans={};
    _VoteStatusHumans[VoteStatusValues.NONE]='-';
    _VoteStatusHumans[VoteStatusValues.CONFIRMED]='Conf';
    _VoteStatusHumans[VoteStatusValues.PRESSED]='Pressd';
    _VoteStatusHumans[VoteStatusValues.PRE_VOTE]='Pre Vote';
    _VoteStatusHumans[VoteStatusValues.VALIDATED]='Valid';

    var _AdmissionColors={}
    _AdmissionColors[AdmissionValue.OUTSIDE]='#000';
    _AdmissionColors[AdmissionValue.TEMPORARY_EXIT]='#F00';
    _AdmissionColors[AdmissionValue.ENTERED]='#0F0';
    _AdmissionColors[AdmissionValue.ADMISSION_IN_PROGRESS]='#FF0'; // yellow
    _AdmissionColors[AdmissionValue.TRANS_ADM_ENTER]='#8F0'; // yellow
    _AdmissionColors[AdmissionValue.TRANS_OUT_ADM]='#880'; // yellow
    _AdmissionColors[0]='#ccc';

    return{
        VoteMode:{
            VOTE:'vote',
            POLL:'poll'
        },
        VoteType:{
            NORMAL:'N',
            STANDARD: "N",
            YESNO : "Y",
            GROUP_JOINED:'J',
            GROUP_SPLITTED : "S",
            MULTI_CHOICE : "M",
            LIST : "L",
            VALUE : "V",
            FAKE : "F",
        },
        ResolutionKind:[
            // {value:'N',label:'None'},
            {value:'O',label:'Ordinary'},
            {value:'E',label:'Extraordinary'},
            {value:'S',label:'Special'}
        ],
        AdmissionMode:[
            {value:'0',label:'New tvt'},
            // {value:'1',label:'Substitution'},
            {value:'2',label:'Add Card'},
        ],
        ErrorCodes:{
            'error.mismatching-meeting-id':'Mismatched meeting Id',
            'error.notfound':'Item not found',
            'error.votation.invalid-or-duplicate':'Invalid votation id, or votation already open:\n{0}',
            'error.missing-parameter':'Missing prameter {0}',
            'error.unknown-parameter':'Unkown parameter {0}',
            'error.wrong-parameter-format':'Wrong parameter format {0}',
            'error.server-error':'Internal server error',
            'error.another-open-votation':'Another votation[{0}] is open. First close it.',
        },
        ButtonCodes:[
            {value:'Y', label:"YES", order:1},
            {value:'N', label:"NO", order:2},
            {value:'A', label:"ABST", order:3},
            {value:'P', label:"PRESIDENT", order:4},
            {value:'X', label:"OTHER", order:5}
        ],
        TextCodes:[
            {value:'T', label:"Title", order:1},
            {value:'L', label:"Label", order:2},
            {value:'R', label:"Res Kind", order:3},
        ],
        FakeVoteAnswerTypes:[
            {value:'M',label:'Modulo'},
            {value:'F',label:'Fixed'}
        ],
        Vote:VoteValues,
        VoteStatus:VoteStatusValues,
        VoteColor:_VoteColors,
        AdmissionColor:_AdmissionColors,
        AdmissionValues: AdmissionValue,
        VoteHumanReadable:_VoteHumans,
        VoteStatusHumanReadable:_VoteStatusHumans,
        MAX_BASES:11,
    }
});
