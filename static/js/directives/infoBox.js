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
