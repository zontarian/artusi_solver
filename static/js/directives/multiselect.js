/**
 * Created by walter on 21/12/15.
 */

angular.module('easyradio')
    .directive('dropdownMultiselect', function(){
    return {
        restrict: 'E',
        scope:{
            model: '=',
            options: '=',
            pre_selected: '=preSelected'
        },
        template: "<div class='btn-group' data-ng-class='{open: open}'>"+
        "<button class='btn btn-small'>{{model}}</button>"+
        "<button class='btn btn-small dropdown-toggle' data-ng-click='open=!open;openDropdown()'><span class='caret'></span></button>"+
        "<ul class='dropdown-menu' aria-labelledby='dropdownMenu'>" +
        "<li><a data-ng-click='selectAll()'><i class='icon-ok-sign'></i>  Check All</a></li>" +
        "<li><a data-ng-click='deselectAll();'><i class='icon-remove-sign'></i>  Uncheck All</a></li>" +
        "<li class='divider'></li>" +
        "<li data-ng-repeat='option in options'> <a data-ng-click='setSelectedItem()'>{{option.label}}<span data-ng-class='isChecked(option.value)'></span></a></li>" +
        "</ul>" +
        "</div>" ,
        controller: function($scope){

            $scope.openDropdown = function(){
                $scope.selected_items = [];
                for(var i=0; $scope.pre_selected && i<$scope.pre_selected.length; i++){
                    $scope.selected_items.push($scope.pre_selected[i].id);
                }
            };

            $scope.selectAll = function () {
                //get all the IDs
                var m=[];
                $scope.options.forEach(function(o){
                    m.push(o.value);
                })
                $scope.model=m;
                //$scope.model = _.pluck($scope.options, 'id');
                console.log($scope.model);
            };
            $scope.deselectAll = function() {
                $scope.model=[];
                console.log($scope.model);
            };
            $scope.setSelectedItem = function(){
                var id = this.option.value;

                //if array contains..
                if ($.inArray(id,$scope.model)>=0) {
                    //remove
                    var a=[];
                    $scope.model.forEach(function(o){
                       if(o!=id)
                           a.push(o);
                    });
                    $scope.model=a;
                } else {
                    $scope.model.push(id);
                }
                console.log($scope.model);
                return false;
            };
            $scope.isChecked = function (id) {
                if ($.inArray(id,$scope.model)>=0) {
                    return 'fa fa-check pull-right';
                }
                return false;
            };
        }
    }
});