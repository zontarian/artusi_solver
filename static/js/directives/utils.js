
angular.module('easyradio')
    .directive('rightClick', function($parse) {
    return function(scope, element, attrs) {
        var fn = $parse(attrs.rightClick);
        element.bind('contextmenu', function(event) {
            scope.$apply(function() {
                event.preventDefault();
                fn(scope, {$event:event});
            });
        });
    };
});


angular.module('easyradio')
    .directive('infoBox', function() {
        return {
            restrict: 'A',
            scope: {
                box: '=infoBox'
            },
            templateUrl: '/static/partials/infobox.html'
        };
    });



angular.module('easyradio')
    .directive('icheck', ['$timeout', '$parse', function($timeout, $parse) {
        return {
            require: 'ngModel',
            link: function($scope, element, $attrs, ngModel) {
                return $timeout(function() {
                    var value;
                    value = $attrs['value'];

                    $scope.$watch($attrs['ngModel'], function(newValue){
                        //console.log($attrs['id'],newValue);
                        $(element).iCheck('update');
                    })

                    return $(element).iCheck({
                        checkboxClass: 'icheckbox_flat-blue',
                        radioClass: 'iradio_flat-blue'

                    }).on('ifChanged', function(event) {
                        if ($attrs['type'] === 'checkbox' && $attrs['ngModel']) {
                            $scope.$apply(function() {
                                return ngModel.$setViewValue(event.target.checked);
                            });
                        }
                        if ($attrs['type'] === 'radio' && $attrs['ngModel']) {
                            return $scope.$apply(function() {
                                return ngModel.$setViewValue(value);
                            });
                        }
                    });
                });
            }
        };
    }])