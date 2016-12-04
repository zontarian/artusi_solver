/**
 * Created by walter on 30/11/15.
 */
angular.module('easyradio').controller('PCBaseCtrl', function($rootScope, $scope, $http, $timeout, $q, EasyradioApi, stateService, constants) {
    // all the items
    $scope.knownItems = [];
    $scope.allSelected=false;
    $scope.modified = false;

    $scope.tooltip={};
    $scope.ui_config=stateService.config.ui;

    $scope.oneSelected=function(){
        var one=false;
        $scope.knownItems.forEach(function(item){
            if(item._selected)
                one=true;
        });
        return one;
    };

    $scope.twoSelectedAndOneIdle=function(){
        var oneActive=false;
        var twoIdle=false
        var numSelected=0;
        $scope.knownItems.forEach(function(item){

            if(item._selected){
                numSelected++ ;
                if( item.type=='a')
                    oneActive=true;
                else if(item.type=='i')
                    twoIdle = true;
            }
        });
        return numSelected == 2 && oneActive && twoIdle;
    }

    // the item being added
    $scope.pcBase = {
        //id:null, //aka pcBaseId
        clone:function(){
            var obj={};

            for(prop in this){
                if(this.hasOwnProperty(prop))
                    obj[prop]=this[prop];
            }
            return obj;
        },
        attributes:function(){
            return ['index','order','type','ip_address','area_id', 'channel', 'power','num_tx_enable' ,'description','_selected']
        },
        //just different labels. Missing attrivutes have label = attribute name
        labels:{
            index:'id',
            ip_address:'ip address',
            num_tx_enable:'num txEnable'
        },
        initFromJson:function(json){
            this.index = json.index;
            this.type = json.status;
            this.ip_address = json.host;
            this.power= json.power ;
            this.num_tx_enable= json.num_tx_enable;
            this.description = json.description;
            this.channel = json.channel >= 0 ? json.channel : null;
            if(this.type == 'a' && this.channel == null)
                this.channel = 0;
            this.order = json.order;
            this.num_tvts = json.num_tvts;
            this.area_id = (json.area_id ? json.area_id : 0);
        },
        serializeToJson:function(){
            var json={
                index: this.index,
                status: this.type,
                host: this.ip_address,
                power: this.power,
                // bs_freqs: this.frequencies,
                description: this.description,
                num_tx_enable: this.num_tx_enable,
                order: this.order,
                channel:(this.channel ? this.channel : 0),
                area_id: this.area_id,
            };
            return json;
        },
        attributesExcept:function(except){
            if(!Array.isArray(except)){
                except=[except];
            }
            var attr=this.attributes();
            var def=[];
            attr.forEach(function(a){
                if(except.indexOf(a)==-1){
                    def.push(a);
                }
            });
            return def;
        },
        labelsExcept:function(except){
            if(!Array.isArray(except)){
                except=[except];
            }
            var attr=this.attributes();
            var def=[];
            var labels=this.labels;
            attr.forEach(function(a){
                if(except.indexOf(a)==-1){
                    t=labels[a]
                    if(!t)
                        t=a;
                    def.push(t);
                }
            });
            return def;
        },
        listForAttr:function(attr, filter){
            if(!filter) filter=false;

            if(attr=='type')
                return $scope.Types;
            // if(attr=='frequencies') {
            //     if(filter)
            //         return _filterList($scope.Frequencies, attr, this);
            //     return $scope.Frequencies;
            // }
            if(attr=='power')
                return $scope.Power;
            // if(attr=='channel') {
            //     if(filter)
            //         return _filterList($scope.Channels, attr, this);
            //     return $scope.Channels;
            // }
            if(attr=='index') {
                if(filter)
                    return _filterList($scope.IDpcBases, attr, this);

                return $scope.IDpcBases;
            }
        },
        reset:function(){
            var $this=this;

            this.attributes().forEach(function(property){
                $this[property]= null;
            })
            this.type=$scope.Types[0].value;
            // this.frequencies=$scope.Frequencies[0].value;
            this.power=$scope.Power[0].value;
            this.channel=0;//$scope.Channels[0].value;
            this.index=$scope.IDpcBases[0].value;
            //get max value

        },
        getLabel:function(attr) {
            //return this.Type;
            var $this=this;
            var _val=null;
            var list=this.listForAttr(attr);
            list.forEach(function(t){
                if($this[attr] == t.value){
                    _val= t.label;
                    return;
                }
            });
            return _val;
        },
        isAttributeWide:function(attr){
            //use labels
            //search attr for label
            var found_attr=null
            for(var true_attr in this.labels){
                var label=this.labels[true_attr];
                if(label==attr){
                    found_attr = true_attr;
                    break;
                }
            }
            if(!found_attr)
                found_attr = attr;

            return found_attr=='frequencies' || found_attr=='ip_address' || found_attr=='description' ;
        },
        isDropdown:function(attr){
            return attr=='type' || attr=='frequencies' || attr=='id' || attr=='index' || attr=='power' ;//|| attr=='channel';
        },
        isWiderDropdown:function(attr){
            return attr=='type'  ;//|| attr=='channel'
        },
        isSlider:function(attr){
            return attr=='num_tx_enable';
        }

    };

    $scope.Types= [
        { value:'i', label:'Idle'},
        { value:'a', label:'Active'},
        // { value:'b', label: 'Broken'}
    ];
    // $scope.IPports=[
    //     {value:30000,label:'30000'},
    //     {value:30001,label:'30001'},
    // ];
    $scope.Power=[
        {value:'0',label:'0'},
        {value:'1',label:'1'},
        {value:'2',label:'2'},
        {value:'3',label:'3'},
    ];
    $scope.IDpcBases=[
        {value:1,label:'1'},
        {value:2,label:'2'},
        {value:3,label:'3'},
        {value:4,label:'4'},
        {value:5,label:'5'},
        {value:6,label:'6'},
        {value:7,label:'7'},
        {value:8,label:'8'},
        {value:9,label:'9'},
        {value:10,label:'10'},
        {value:11,label:'11'},
        {value:12,label:'12'},
        {value:13,label:'13'},
        {value:14,label:'14'},
        {value:15,label:'15'},
        {value:16,label:'16'},
        {value:17,label:'17'},
        {value:18,label:'18'},
        {value:19,label:'19'},
        {value:20,label:'20'}
    ];
    //
    $scope.Channels=[
        {value:0, label:'0'},
        {value:10,label:'10'},
        {value:20,label:'20'},
        {value:30,label:'30'},
        {value:40,label:'40'},
        {value:50,label:'50'},
        {value:60,label:'60'},
        {value:70,label:'70'},
        {value:80,label:'80'},
    ];

    function _filterList(list,attribute,item){
        //filter values in list whose value is already in an object
        var newlist=[];
        for(var i=0;i<list.length;i++){
            //search
            var v=list[i].value;
            var found = false;
            for(var j=0;j<$scope.knownItems.length;j++){
                if($scope.knownItems[j][attribute] == v && $scope.knownItems[j].index!= item.index){
                    found=true;
                }
            }
            if (!found){
                newlist.push(list[i]);
            }
        }
        return newlist;
    }

    $scope.pcBase.reset();
    // indicates if the view is being loaded
    $scope.loading = false;
    // indicates if the view is in add mode
    $scope.addMode = false;

    // Toggle the grid between add and normal mode
    $scope.toggleAddMode = function () {
        $scope.addMode = !$scope.addMode;

        if($scope.addMode){
            //no more than 11
            var len= $scope.knownItems.length;
            if(len==constants.MAX_BASES){
                $scope.addMode = !$scope.addMode;
                alertify.error("Max bases number reached. Cannot add more");
                return;
            }
        }

        // Default new item name is empty
        $scope.pcBase.reset();
        $scope.pcBase.index=_getFirstFreeId();
        $scope.pcBase.order=_getMinOrder();
        $scope.pcBase.channel=_getNextChannel();
        // $scope.pcBase.frequencies = _getNextFreq();
        $scope.pcBase.num_tx_enable = 0;
        $scope.pcBase.new_item = true;
    };

    // Toggle an item between normal and edit mode
    $scope.toggleEditMode = function (item) {
        // Toggle
        item.editMode = !item.editMode;

        // if item is not in edit mode anymore
        if (!item.editMode) {
            // Restore name
            //item.name = item.serverName;
            item = item.oldItem.clone();// JSON.parse(JSON.stringify(item.oldItem))
            $scope.tooltip={};
        } else {
            // save server name to restore it if the user cancel edition
            //item.serverName = item.name;
            var oldItem= item.clone();// JSON.parse(JSON.stringify(item))
            item.oldItem=oldItem;

            // Set edit mode = false and restore the name for the rest of items in edit mode
            // (there should be only one)
            $scope.knownItems.forEach(function (i) {
                // item is not the item being edited now and it is in edit mode
                if (item.index != i.index && i.editMode) {
                    // Restore name
                    //i =JSON.parse(JSON.stringify(i.oldItem))
                    i= i.oldItem.clone();
                    //i.name = i.serverName;
                    i.editMode = false;
                }
            });
        }
    };
    // Creates the 'pcBase' on the server
    $scope.createItem = function (truecreate) {
        // Check if the item is already on the list
        truecreate = truecreate || false;
        var duplicated = false;// isNameDuplicated($scope.pcBase.name);

        if (!duplicated) {
            //get max ID, and increment it
            $scope.pcBase.index=_getFirstFreeId();

            //get minimum order and decrement it
            $scope.pcBase.order = _getMinOrder();

            //clone
            var pcBase=  $scope.pcBase.clone(); // JSON.parse(JSON.stringify($scope.pcBase))
            // Add at the first position
            //$scope.knownItems.unshift(pcBase);
            $scope.knownItems.push(pcBase);
            _sortPcBases($scope.knownItems);

            $scope.toggleAddMode();
            // console.log( pcBase);
            //requestSuccess();
            if(truecreate)
                $scope.modified = true;

            return pcBase;
        } else {
            alertify.error("The item already exists.");
            return null;
        }
    }

    // Updates an item
    $scope.updateItem = function (item) {
        item.editMode = false;

        // Only update if there are changes
        if (isDirty(item)) {
            var idx=-1;
            $scope.knownItems.find(function(e,i){
                if(e.index==item.index){
                    idx=i;
                    return true;
                }
                return false;
            });
            if(idx>=0) {
                $scope.modified = true;
                $scope.knownItems[idx] = item;
                // console.log( item)
                _sortPcBases($scope.knownItems);
                requestSuccess();
            }
        }
    }

    $scope.isFormInvalid = function(pcBase){
        if(!('editMode' in pcBase ) || pcBase.editMode == false) {
            if(!('new_item' in pcBase && pcBase.new_item))
                return false;
        }

        $scope.tooltip['ip_address']=null;

        //mandatory
        valid= pcBase.description && pcBase.description!='';
        valid = valid && (pcBase.ip_address && pcBase.ip_address!='') ;
        //IP patern
        //check only if not emulatino
        if(stateService.config.emulator.state == false) {
            var pattern = /\b(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/;
            validip = pattern.test(pcBase.ip_address);
            if (!validip) {
                $scope.tooltip['ip_address'] = 'Wrong IP format';
            }
            valid = valid && validip;
        }

        //test if ip is already present
        var already_present = false;
        $scope.knownItems.forEach(function (i) {
            // item is not the item being edited now and it is in edit mode
            if (pcBase.ip_address == i.ip_address && pcBase.index!=i.index) {
                // Restore name
                already_present=true;
                $scope.tooltip['ip_address']='Duplicate IP address';
                return false;
            }
        });

        //refresh
        // console.log("Checling "+pcBase.ip_address);
        $('#ip_address_input').tooltip('hide');

        if($scope.tooltip['ip_address'])
            $('#ip_address_input').tooltip('show');
        else {
            // console.log("Hide")
            $('#ip_address_input').tooltip('hide');
        }

        valid = valid && !already_present;

        return !valid;
    }

    // Deletes an item
    $scope.deleteItem = function (item) {
        //show popup
        var descr='';
        if(item.Description){
            descr=' ('+item.Description+')';
        }
        var confirm=alertify.confirm('delete PCBase '+item.index  +descr+'?',function(){
            var idx=-1;
            $scope.knownItems.find(function(e,i){
                if(e.index==item.index){
                    idx=i;
                    return true;
                }
                return false;
            });
            if(idx>=0) {
                $scope.modified = true;
                $scope.knownItems.splice(idx, 1);
                requestSuccess();
                _sortPcBases($scope.knownItems);
                $scope.$apply();
            }
        });

    }

    $scope.reorder = function(pcbase, dir){
        //get next or prev
        var idx=-1;
        $scope.knownItems.find(function(e,i){
            if(e.index==pcbase.index){
                idx=i;
                return true;
            }
            return false;
        });
        if(idx<0)
            return; // ??? should NEVER happen

        swapidx= -1;
        if(dir<0 && idx>0){
            swapidx = idx-1
        }
        else if(dir>0 && idx<$scope.knownItems.length-1){
            swapidx = idx +1
        }
        if(swapidx==-1)
            return;//nothing to swap

        swapitem = $scope.knownItems[swapidx]
        //swap order
        tmp=swapitem.order;
        swapitem.order = pcbase.order;
        pcbase.order = tmp;

        //resort
        _sortPcBases($scope.knownItems);
        //taint scope
        $scope.modified=true;
    };

    $scope.selectAll=function(value){
        console.log("SELECTED = "+value, $scope.allSelected)
        //select all
        $scope.knownItems.forEach(function(item){
            item._selected=value;
        })
    }


    $scope.changeValue=function(attr,item, isNew){
        var value=item[attr];
        console.log("Change value "+attr,value);
        if(attr=='index'){
            //check new value is unique
            var counter=0;//since we don't know which row we are editing we count, if value appears
            //two times, we give an error
            $scope.knownItems.forEach(function(item){
                console.log("Item "+item.index);
                if(item.index==value){
                    counter++;
                }
            });

            if(counter>=2 || (isNew && counter>=1)){
                alertify.error("ID already taken");
                if(item.oldItem)
                    item.index=item.oldItem.index;
                else {
                    item.index = _getFirstFreeId();
                    //get first free ID
                }
            }
        }
    };

    function _getFirstFreeId(){
        //can be better. maybe search for a hole in the sequence.. i.e. the first "free" id from 1 to 20?
        var maxId=0;
        $scope.knownItems.forEach(function(t){
            if(t.ip_address != 'CAFEBABE' && t.index>maxId)
                maxId= t.index;
        });
        return maxId+1;
    }

    function _getMaxOrder(){
        var max = 0;
        $scope.knownItems.forEach(function(t){
            if(t.order>max)
                max = t.order;
        });
        return max+1;
    }

    function _getMinOrder(){
        var min = 100;
        $scope.knownItems.forEach(function(t){
            if(t.order<min)
                min = t.order;
        });
        return min-1;
    }

    function _getNextChannel() {
        var maxId = -1;
        var step = $scope.ui_config.pcbases.new_bs_channel_step;
        // console.log("STEP for next is " + step)
        $scope.knownItems.forEach(function (t) {
            var i = _getIndexInList($scope.Channels, t.channel);
            if (i > maxId)
                maxId = i;
        });
        //get value.

        var maxVal = $scope.Channels[0].value;
        var nextVal = maxVal;
        if (maxId >= 0) {
            maxVal = $scope.Channels[maxId].value;
            nextVal = maxVal + step;
        }
        //now search for this..
        var nextId = _getIndexInList($scope.Channels, nextVal)
        if(nextId>=0)
            maxId= nextId;
        else if(maxId<$scope.Channels.length-1)
            maxId++;

        return $scope.Channels[maxId].value;
    }


    function _getIndexInList(list,item){
        for(var i=0;i<list.length;i++){
            if(list[i].value == item)
                return i;
        }
        return -1;
    }


    function _setPcBases(pcbases){
        $scope.knownItems=[];
        var len=0;
        if(pcbases)
            len=pcbases.length;
        else
            len=0;

        //create empty items
        for(i=0;i<len;i++){
            var item=$scope.createItem(false);//and add to knownItems
            var resp=pcbases[i];
            item.initFromJson(resp);
        }
        if(len){
            //sort according to order
            $scope.knownItems = _sortPcBases($scope.knownItems)
        }
    }

    function _sortPcBases(list){
        function compare(a,b) {
            if (a.order < b.order)
                return -1;
            if (a.order > b.order)
                return 1;
            return 0;
        }

        list.sort(compare);
        return list;
    }


    $rootScope.$on('PCBASES_UPDATED', function() {

        var editMode=$scope.modified;
        $scope.knownItems.forEach(function(item){
            if(item.editMode)
                editMode=true;
        });

        //test if one pcbase is selected ..
        var atLeastOneSelected = $scope.oneSelected();

        //refresh? could lose some changes if you were editing..
        if($scope.addMode || editMode || atLeastOneSelected)
            return;

        getAllItems();
    });
    // Get all items from the server
    function  getAllItems() {
        $scope.loading = true;
        var pcbases=stateService.pcbases; //$sessionStorage.pcbases;
        _setPcBases(pcbases);
        $scope.loading = false;
        $scope.addMode = false; //it is set by _setPcBase / createItem()
    };

    $scope.saveAllItems = function(posthandler){
        $scope.loading = true;
        //clean data
        var pcs=[];
        $scope.knownItems.forEach(function(item){
            var it=  $scope.pcBase.clone();
            it.reset();

            var attrs=item.attributesExcept('_selected');
            for(var i=0;i<attrs.length;i++) {
                var prop=attrs[i];
                it[prop] = item[prop];
            }
            json = it.serializeToJson();
            pcs.push(json);
        });


        EasyradioApi.savePcBase(pcs).then(function(data){
            $scope.loading=false;
            alertify.success("PC base list saved");
            $scope.modified = false;
            if(posthandler){
                posthandler();
            }
        },function(err){
            requestError(err);
            $scope.loading=false;
        });
    };

    // In edit mode, if user press ENTER, update item
    $scope.updateOnEnter = function (item, args) {
        // if key is enter
        if (args.keyCode == 13) {
            $scope.updateItem(item);
            // remove focus
            args.target.blur();
        }
    };

    // In add mode, if user press ENTER, add item
    $scope.saveOnEnter = function (item, args) {
        // if key is enter
        if (args.keyCode == 13) {
            $scope.createItem();
            // remove focus
            args.target.blur();
        }
    };

    $scope.fieldDisabled=function(item,attribute){
        if(item.type == 'i'){
            // if(attribute == 'channel')
            //     return true;
        }
        return false;
    };

    //init
    getAllItems();
    //init sliders
    $("input.slider").slider();


    // PRIVATE FUNCTIONS
    var requestSuccess = function () {
        alertify.success('success');
    }

    var requestError = function (msg) {
        alertify.error(msg);
    }

    var isNameDuplicated = function (itemName) {
        return $scope.knownItems.some(function (entry) {
            return entry.name.toUpperCase() == itemName.toUpperCase();
        });
    };

    var isDirty = function(item) {
        if(!item.hasOwnProperty('oldItem'))
            return false;

        var oldItem=item.oldItem;
        for (var property in item) {
            if (item.hasOwnProperty(property)) {
                // do stuff
                if(item[property] != oldItem[property])
                    return true;
            }
        }
        return false;
        //return item.name != item.serverName;
    }


    /** commands to base station **/
    function _sendCommandToSelectedBaseStations(command, all){
        var ids=_selectedPcbaseIds();
        if(ids.length==0 && !all)
            return;
        var p=null;
        if(command=='restartLocked'){
            p= EasyradioApi.baseRestartLocked(ids);
        }else if(command=='sendBroadcastMaps'){
            p=EasyradioApi.baseBroadcast(ids);

        }else if(command=='exportData4Client'){

        }else if(command=='baseOn'){
            p= EasyradioApi.baseStart(ids);

        }else if(command=='baseOff'){
            p= EasyradioApi.baseStop(ids);
        }else if(command=='restartBase'){
            p= EasyradioApi.baseRestart(ids);
        }else if(command=='swapBase'){
            p= EasyradioApi.baseSwap(ids);
        }else if(command=='loadMapInBase'){
            p= EasyradioApi.baseLoad(ids);
        }
        if(p){
            p.then(function(success){
                alertify.success("Command issued");
                //return Promise.resolve(success);
                deselectBases();
            },function(err){
                console.error("ERROR CALLING API ",err)
                alertify.error("Error calling API")
                deselectBases();
            })
        }
    }
    //commands

    function _selectedPcbaseIds(){
        //list ids..
        var pcbIds=[];
        $scope.knownItems.forEach(function(pcb){
            if(pcb._selected)
                pcbIds.push(pcb.index)
        });
        //convert to strings
        return pcbIds.join(",");
    }
    $scope.restartLocked = function(){
        console.log("BASE restartLocked on base " )
        _sendCommandToSelectedBaseStations('restartLocked',true);
    }

    $scope.sendBroadcastMaps = function(){
        console.log("sendBroadcastMaps " )
        _sendCommandToSelectedBaseStations('sendBroadcastMaps',true);
    }

    $scope.exportData4Client = function(){
        console.log("BASE exportData4Client on base " )
        _sendCommandToSelectedBaseStations('exportData4Client',true);
    }

    $scope.baseOn = function(){
        console.log("BASE ON on base " ,_selectedPcbaseIds());

        _sendCommandToSelectedBaseStations('baseOn');
    }
    $scope.baseOff = function(){
        console.log("BASE OFF on base " );

        _sendCommandToSelectedBaseStations('baseOff');

    }
    $scope.restartBase = function(){
        console.log("BASE RESTART on base " )
        _sendCommandToSelectedBaseStations('restartBase');
    }

    $scope.swapBase = function(){
        console.log("BASE Swaps on base ")
        //change status of idle to active
        //and of active to idle
        var active = null;
        var idle = null;
        $scope.knownItems.forEach(function(item){
            if(item._selected && item.type == 'a')
                active = item;
            else if(item._selected && item.type == 'i')
                idle = item;
        });
        //now.. wap status
        active.type='i'; // not as broken.. as Idle.. as in Broken
        idle.type='a';
        //copy data from old active base to new active (the old "ilde" base)
        idle.channel = active.channel;
        idle.power = active.power;
        idle.num_tx_enable = active.num_tx_enable

        $scope.saveAllItems(function(){

            //if system is active
            //
            if($scope.running) {

                //and stop old one
                EasyradioApi.baseStop([active.index]);
                //activate newly active base
                EasyradioApi.baseStart([idle.index]);
            }
            deselectBases();
        });
        // _sendCommandToSelectedBaseStations('swapBase');
    }

    function deselectBases(){
        //deselect items
        $scope.knownItems.forEach(function(item){
            item._selected  = false;
        });
    }

    $scope.loadMapInBase = function(){
        console.log("  loadMapInBase on base " );
        _sendCommandToSelectedBaseStations('loadMapInBase');
    }

});
