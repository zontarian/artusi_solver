/**
 * Created by walter on 08/12/15.
 */
angular.module('easyradio').controller('PcBaseStatusCtrl', function ($rootScope, $scope, $http, $timeout, $q, EasyradioApi, stateService) {
    // all the items

    //
    $scope.love='paola';

    $scope.pcbaseboxstatus={};
    $scope.baseStations=[];

    $scope.counter=1;

    $scope.incr= function(){
        $scope.counter = $scope.counter + 1;
    }

    //decoding
    var _powerSupply={
        0:'battery',
        1:'power mains',
    };

    var _votingMode={
        0: 'None',
        1:'polling',
        2:'continuous polling',
        3:'unknown',
        4:'callback'
    };

    function updateBaseStations(baseStations){
        var bss=[];
        if(!Array.isArray(baseStations))
            return;

        //try to update only if newer
        baseStations.forEach(function(bs){
            //look for corresponding base station
            var base = _findBaseStation(bs.index);
            var info={
                        power_supply:_powerSupply[bs.power_supply],
                        build_version:bs.build_version,
                        firmware_version:bs.firmware_version,
                        version:bs.major_version + "." + bs.minor_version,
                        battery_charge:bs.battery_charge,
                        voting_mode: _votingMode[bs.voting_mode]
                    };
            if(!base){
                //extend with data..
                var BB = bs;
                BB['info'] = info;
                //and add new base
                $scope.baseStations.push(BB)
            }else{
                //just  update info, don't change base data
                base['pcbase_status'] = bs.pcbase_status;
                base['base_status'] = bs.base_status;
                base['battery_charge'] = bs.battery_charge;
                base['compatibility'] = bs.compatibility;
                base['info'] = info;
            }
        })

        // baseStations.forEach(function(bs){
        //     var b=bs;
        //     b['info']={
        //         power_supply:_powerSupply[bs.power_supply],
        //         build_version:bs.build_version,
        //         firmware_version:bs.firmware_version,
        //         version:bs.major_version + "." + bs.minor_version,
        //         battery_charge:bs.battery_charge,
        //         voting_mode: _votingMode[bs.voting_mode]
        //     };
        //     bss.push(b);
        // })
        // $scope.baseStations=bss;
    }

    function _findBaseStation(index){
        var bs=null;
        $scope.baseStations.forEach(function(b){
            if(b.index == index){
                bs=b;
                return;
            }
        });
        return bs;
    }

    var baseStations = stateService.pcbases;
    updateBaseStations(baseStations);

    $rootScope.$on('DATA_UPDATED', function() {
        baseStations = stateService.pcbases;
        updateBaseStations(baseStations);
        // $scope.$apply();
    });


    $scope.getClass = function(base,attrib){
        if(attrib=='system'){
            if(base.pcbase_status==1)
                return 'status-on';
            return 'status-off';
        }else if(attrib=='antenna'){
            if(base.base_status==3)
                return 'status-on';
            if(base.base_status==1 || base.base_status==2)
                return 'status-failing';
            if(base.base_status==0)
                return 'status-off';
            return 'status-failing';
        }else if(attrib=='sbattery'){
            clazz = $scope.getClass(base,'battery')

            if(base.battery_charge<10)
                return 'status-off '+clazz;
            if(base.battery_charge<35)
                return 'status-failing '+clazz;
            return 'status-on '+clazz;
        }
        else if(attrib=='battery'){
            if(base.battery_charge<10)
                return 'fa-battery-0';
            if(base.battery_charge<35)
                return 'fa-battery-1';
            if(base.battery_charge<60)
                return 'fa-battery-2';
            if(base.battery_charge<85)
                return 'fa-battery-3';
            return 'fa-battery-4'
        }
        else if(attrib=='compatibility'){
            if(base.compatibility==2)
                return 'status-on';
            if(base.compatibility==1)
                return 'status-failing';
            return 'status-off';
        }
        else if(attrib=='BASE'){
            if(_isPcBaseFaulty(base))
               return 'status-off';// return 'box-danger';

            if(base.antenna <=2 || base.battery < 35 || base.compatibility == 1)
                return 'status-failing';//return 'box-warning';

            return 'status-on';//'box-success';
        }
    }

    function _isPcBaseFaulty(pcbase){
        //if any of the three bsae params (battery, system or antenna is OFF, return OFF)
        return pcbase.pcbase_status==0 || pcbase.base_status == 0 || pcbase.battery_charge < 10 || pcbase.compatibility==0;
    }

    $scope.problemInStations = function () {
        for(i in $scope.baseStations){
            base = $scope.baseStations[i]
            if(_isPcBaseFaulty(base))
                return true;
        }
        return false;
    };



/*
    function listen_events() {
        console.log("When its done");

        $obj = $('.pcbase-collapse');

        $obj.on("click",function(){
            classes = $(this).closest('.box').attr('class')
            // console.log("Click", classes);
            collapsed=(classes.indexOf('collapsed-box') >= 0);
            collapsed = !collapsed; //because we fire before dom has changed
            console.log("Collapsed:",collapsed);

            //climb up
            b = $(this).parents('.box');
            base_index = b.attr('base-index');
            console.log(base_index);
            $scope.pcbaseboxstatus[base_index]=collapsed;
        });

    };


    function expandBase(base_index, expand){
        box = $('.box[base-index='+base_index+']')
        // console.log(box);
        box_collapsed =  box.hasClass("collapsed-box");

        button = $(box).find('.pcbase-collapse');
        // console.log(button);
        // click only if different
        if(expand && box_collapsed || !expand && !box_collapsed)
            $(button).click();

    }
*/
});
