(function ContextMenu($angular, $document) {

    "use strict";

    /**
     * @module ngContextMenu
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/ngContextMenu
     */
    var module = $angular.module('ngContextMenu', []);

    /**
     * @module ngContextMenu
     * @service ContextMenu
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/ngContextMenu
     */
    module.factory('contextMenu', ['$rootScope', function contextMenuService($rootScope) {

        /**
         * @method cancelAll
         * @return {void}
         */
        function cancelAll() {
            $rootScope.$broadcast('context-menu/close');
        }

        return { cancelAll: cancelAll, eventBound: false, shown: false, shownTime: null };

    }]);

    /**
     * @module ngContextMenu
     * @directive contextMenu
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/ngContextMenu
     */
    module.directive('contextMenu', ['$http', '$timeout', '$interpolate', '$compile', 'contextMenu', 'grid',

        function contextMenuDirective($http, $timeout, $interpolate, $compile, contextMenu, grid) {

            return {

                /**
                 * @property restrict
                 * @type {String}
                 */
                restrict: 'EA',

                /**
                 * @property scope
                 * @type {Boolean}
                 */
                scope: true,

                /**
                 * @property require
                 * @type {String}
                 */
                require: '?ngModel',

                /**
                 * @method link
                 * @param {Object} scope
                 * @param {angular.element} element
                 * @param {Object} attributes
                 * @param {Object} model
                 * @return {void}
                 */
                link: function link(scope, element, attributes, model) {

                    if (!contextMenu.eventBound) {

                        // Bind to the `document` if we haven't already.
                        $document.addEventListener('click', function click() {
                            contextMenu.cancelAll();
                            scope.$apply();
                        });

                        contextMenu.eventBound = true;

                    }

                    /**
                     * @method closeMenu
                     * @return {void}
                     */
                    function closeMenu() {

                        if (scope.menu) {
                            contextMenu.shown = false; //WG
                            contextMenu.shownTime = null; //WG
                            scope.menu.remove();
                            scope.menu     = null;
                            scope.position = null;
                        }

                    }

                    scope.$on('context-menu/close', closeMenu);

                    /**
                     * @method getModel
                     * @return {Object}
                     */
                    function getModel() {
                        return model ? $angular.extend(scope, model.$modelValue) : scope;
                    }

                    /**
                     * @method render
                     * @param {Object} event
                     * @param {String} [strategy="append"]
                     * @return {void}
                     */
                    function render(event, strategy) {

                        strategy = strategy || 'append';

                        if ('preventDefault' in event) {

                            var directive_offset=scope.$eval(attributes.contextMenuOffset);
                            console.log("Directive offset s", directive_offset);
                            contextMenu.cancelAll();
                            event.stopPropagation();
                            event.preventDefault();
                            //scope.position = { x: event.clientX, y: event.clientY };//WG
                            //WG for ui grid we have to tweak position
                            var elem = $angular.element(event.target);
                            var elem_pos=elem.position();
                            var elem_off=elem.offset();
                            // console.log(elem_pos, elem_off, event.screenX, event.screenY, event.clientX, event.clientY)
                            // var viewport=$angular.element('.ui-grid-viewport');
                            // var canvasc=$angular.element('#canvas_container');
                            //var canvas=$angular.element('#tvtcanvas')

                            var vp_off={top:0,left:0};
                            var headerHeight=0;

                            //DIRTY DIRTY DIRTY.. depending on the case, we tweak coordinates..
                            // and it gets tricky in the dashboard page where we have a container / canvas AND a ui grid

                            if(directive_offset){
                                vp_off.top = directive_offset.y || 0;
                                vp_off.left = directive_offset.x || 0;
                                headerHeight = directive_offset.h || 0;
                            }

                            // scope.position = { x: event.offsetX+elem_pos.left, y: event.offsetY +elem_pos.top+headerHeight};//WG
                            scope.position = {
                                y : elem_off.top - vp_off.top + headerHeight + event.offsetY + 10,
                                x:elem_off.left - vp_off.left + event.offsetX
                            };
                            //WG end
                        } else {

                            if (!scope.menu) {
                                return;
                            }

                        }

                        if(window.devicePixelRatio!=1){
                            alertify.warning("No context menu if zooming in/out. At the moment..")
                            return;
                        }

                        $http.get(attributes.contextMenu, { cache: true }).then(function then(response) {
                            var compiled     = $compile(response.data)($angular.extend(getModel())),
                                menu         = $angular.element(compiled);

                            // Determine whether to append new, or replace an existing.
                            switch (strategy) {
                                case ('append'): element.append(menu); break;
                                default: scope.menu.replaceWith(menu); break;
                            }
                            //menu.css({
                            //    position: 'fixed',
                            //    //top: 0,
                            //    //left: 0,
                            //    //transform:'translate(30px,-16px)'
                            //});

                            menu.css({

                                position: 'fixed',
                                top: 0,
                                left: 0,
                                transform:'translate('+scope.position.x+'px, '+scope.position.y+'px)' //WG

                            });

                            //WG start
                            // hide tooltip if any
                            grid.hideTooltip();
                            var t=grid.getCurrentTelevoter();
                            // console.log("Current televoter is",t);
                            contextMenu.shown = true;
                            contextMenu.shownTime = new Date()
                            //WG end


                            scope.menu = menu;
                            scope.menu.bind('click', closeMenu);

                            //do some magic, so that element is inside brower viewport, if possible.. //WG
                            var observer = new MutationObserver(function(mutations) {
                                console.log('Attributes changed! zoom:', window.devicePixelRatio);
                                var v=$angular.element(".context-menu");
                                var h= v.height();
                                var w= v.width();
                                var elem_pos=v.position();
                                var elem_off=v.offset();
                                var bh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

                                console.log('Attributes changed!',elem_pos,elem_off,w,h,bh);
                                if(elem_pos.top+h>bh){
                                    //scroll back
                                    var delta = elem_pos.top+h-bh;
                                    v.css({

                                        position: 'fixed',
                                        top: 0,
                                        left: 0,
                                        transform:'translate('+scope.position.x+'px, '+(scope.position.y -delta)+'px)' //WG
                                        //transform: $interpolate('translate({{x}}px, {{y}}px)')({ //WG interpolate didn't work
                                        //    x: scope.position.x, y: scope.position.y
                                        //})

                                    });
                                }
                                //ok now we have to scroll it so that it is inside viewport

                            });
                            var target = document.querySelector('.context-menu');
                            observer.observe(target, {
                                attributes: true,
                                childList: true,
                                subtree:true
                            });


                        });

                    }

                    if (model) {

                        var listener = function listener() {
                            return model.$modelValue;
                        };

                        // Listen for updates to the model...
                        scope.$watch(listener, function modelChanged() {
                            render({}, 'replaceWith');
                        }, true);

                    }

                    element.bind(attributes.contextEvent || 'contextmenu', render);

                }

            }

        }]);

})(window.angular, window.document);
