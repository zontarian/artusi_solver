/**
 * Created by walter on 30/11/15.
 */
angular.module('easyradio').controller('AdmissionCtrl',
    function($rootScope, $scope, $http, $timeout, $q, EasyradioApi, stateService, constants, grid, televoterMenu) {
    // all the items

    //trick the scope to have an entity called "rc" for the context menu
    $scope.rc = {
        entity: function(){
            return grid.getCurrentTelevoter();
        },
        menuItems: function(){
            return televoterMenu.menuItems;
        },
        menuFunc: televoterMenu.menuFunc

    };

    $scope.admissionStat = {
        outside: 0,
        entered: 0,
        inprogress: 0,
        tempexit: 0,
        unknown: 0
    };

        $scope.canSaveConfig = function(){
        return $scope.formconfig.$dirty;
    };

    $scope.admission = {
        shutdownTvt: false,
        backupFreqs:{
            start: 0,
            step: 10,
            number: 4
        }
    }

    $scope.saveConfig = function(){
        $scope.canSaveConfig = false;
    };

    $scope.rightClick=function(event){
        var scope = angular.element(event.toElement).scope()
        console.log('RC got here',scope.rowRenderIndex);
        //contextMenu.cancelAll();
    };

    $rootScope.$on('NEW_TVT_LIST', function(evt, tvts, max_id) {
        update_admission_grid(tvts, max_id, false);
    });


    function update_admission_grid(tvts, max_id){

        grid.updateGrid(tvts, max_id, false, 'tvtcanvas',function(element){
            var status = element.admstatus;
            return constants.AdmissionColor[status] != undefined ?
                constants.AdmissionColor[status] : constants.AdmissionColor[0];
        });
        //update stats
        var unknown = 0;
        var entered = 0;
        var inprogress = 0;
        var tempexit = 0;
        var outside = 0;

        for(t in tvts){
            tvt = tvts[t]
            switch (tvt.admstatus){
                case constants.AdmissionValues.OUTSIDE:
                    outside ++;
                    break;
                case constants.AdmissionValues.TEMPORARY_EXIT:
                    tempexit ++;
                    break;
                case constants.AdmissionValues.ENTERED:
                    entered ++;
                    break;
                case constants.AdmissionValues.ADMISSION_IN_PROGRESS:
                    inprogress ++;
                    break;
                default:
                    unknown ++;
                    break;
            }
        };
        $scope.admissionStat.unknown = unknown;
        $scope.admissionStat.entered = entered;
        $scope.admissionStat.inprogress = inprogress;
        $scope.admissionStat.tempexit = tempexit;
        $scope.admissionStat.outside = outside;

    };
    /*
     _AdmissionColors[AdmissionValue.OUTSIDE]='#000';
     _AdmissionColors[AdmissionValue.TEMPORARY_EXIT]='#F00';
     _AdmissionColors[AdmissionValue.ENTERED]='#0F0';
     _AdmissionColors[AdmissionValue.ADMISSION_IN_PROGRESS]='#FF0'; // yellow
     _AdmissionColors[AdmissionValue.TRANS_ADM_ENTER]='#8F0'; // yellow
     _AdmissionColors[AdmissionValue.TRANS_OUT_ADM]='#880'; // yellow
     _AdmissionColors[0]='#ccc';
     */

    $scope.handleCanvasMove = function(event){

        grid.handleCanvasMove(event,'canvasElement', function(t){
           return 'Card Id/idx:'+t.card.card_id+':'+t.card.index+"<br /> "+t.card.name+ "<BR />status: "+t.card.admstatus
               +"<br />on channel: "+t.card.channel;

        });
    };

});
