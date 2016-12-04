/**
 * Created by walter on 16/08/16.
 */

angular.module('easyradio').factory('grid', function(contextMenu, constants) {

    var square_size = 10; //10
    var squares_per_row = 70; //800 / square_size;
    var televoter_list = [];

    var lastTooltipCardId = -1;
    var tooltipElementId = null;
    var currentTelevoter = null;

    // handle tooltip, by faking an element id with no content to move where we want the tooltip top be
    function handleCanvasMove(event, tooltipFakeElementId, tooltip_function){
        var x = event.offsetX;
        var y = event.offsetY;
        tooltipElementId = tooltipFakeElementId;
        // console.log("move", event)
        //check if x is inside a televoter..
        // console.log("HandleCanvasMove")
        var need_tooltip=false;
        televoter_list.every(function(t){
            // console.log("Checking "+x+","+y+" against",t)
            if(x>= t.x && x <= t.x+t.size && y >= t.y && y<= t.y+t.size){
                var px = event.pageX;
                var py = event.pageY;
                currentTelevoter = t.card;

                need_tooltip = true;
                //don't redraw same tooltip
                if(t.card.card_id == lastTooltipCardId) {
                    // console.log("no need for tooltip again",lastTooltipCardId)
                    return false;
                }

                var now=new Date();
                var delta = 100 * 1000;
                if(contextMenu.shownTime)
                    delta=now - contextMenu.shownTime;

                // console.log("contextmenu ",contextMenu.shown,delta);
                // hide context menu if displayed..
                if(contextMenu.shown && delta>2*1000) {
                    console.log(contextMenu)
                    contextMenu.cancelAll();
                }


                lastTooltipCardId = t.card.card_id;
                // add a delta to center tooltip in middle of square, on the bottom
                var deltaX = x - t.x;
                var deltaY = y - t.y;
                px = px - deltaX + square_size / 2;
                py = py - deltaY + square_size/2;
                var title = tooltip_function(t);

                $('#'+tooltipFakeElementId).attr('title',title).attr('data-original-title',title).css({'position':'absolute','top':py,'left':px}).tooltip({
                    trigger: 'hover move',
                    placement:'bottom',
                    html:true
                }).tooltip('show');
                // console.log("we need a tooltip")

                return false;
            }
            return true;
        });

        if(!need_tooltip){
            //remove tooltip
            $('#'+tooltipFakeElementId).tooltip('destroy');
            lastTooltipCardId = -1;
            // console.log("remove tooltip")
        }
    };

    function hideTooltip(){
        $('#'+tooltipElementId).tooltip('destroy');
        lastTooltipCardId = -1;
    }

    function getCurrentTelevoter() {
        return currentTelevoter;
    }

    //update votation data on canvas grid. Draw Grid
    function updateGrid(tvts, max_id, show_votes, canvasId, colorFunction) {

        var canvas = document.getElementById(canvasId);
        if (!canvas || !canvas.getContext)
            return;

        //hide spinner
        container = document.getElementById('canvas-spinner');
        $(container).css({'display':'none'})

        container = document.getElementById('canvas_container');
        container_width = $(container).width();
        container_height = $(container).height();

        //show canvas
        $(canvas).css({'display':'block'});

        // offset from canvas border
        var x_offset = 40;
        var y_offset = 20;

        //wh = window.innerHeight

        canvas_width= container_width;
        // canvas_height = wh - canvas_y;

        //calculate squares per row, with a precise rule, no 73 squares per row or 39..
        squares_per_row = Math.floor(( canvas_width - x_offset * 2 ) / square_size);
        if(squares_per_row<50)
            squares_per_row = 25;
        else if(squares_per_row<100)
            squares_per_row = 50;
        else
            squares_per_row = 100;

        // reset internal list
        televoter_list = []

        // reset canvas
        var ctx = canvas.getContext('2d');
        ctx.canvas.width = canvas_width;
        // ctx.canvas.height = canvas_height;
        $(canvas).width(canvas_width);
        // $(canvas).height(canvas_height  -5 /* - 15 */ ); // 15 =  margin , -5 is magic if we don't want canvas to grow at each iteration


        // ctx.clearRect(0, 0, canvas_width, canvas_height);
        //test: fill color
        // ctx.fillStyle = "rgba(205, 205, 0, 1)";
        // ctx.fillRect(0, 0, canvas_width, canvas_height);
        // return;

        // draw labels
        ctx.font = "12px serif";
        ctx.fillStyle = "rgba(255, 0, 0, 1)";
        ctx.strokeStyle = "rgb(0,0,0)"; //black

        var label_done={};

        // sort tvts by card id and calculate max height
        var sortedTvts = tvts.sort(function(a,b){
            return a.index < b.index ? -1 : +1;
            // return a.card_id < b.card_id ? -1 : +1;
        });
        var max_height= 100;
        var lastTvt = tvts[tvts.length-1];
        if(lastTvt) {
            var idx = lastTvt.index;
            var row = Math.floor(idx / squares_per_row);
            max_height= y_offset + row * square_size + square_size;
        }
        ctx.canvas.height = max_height;
        $(canvas).height(max_height);


        //rebase indexes
        // var minIdx=999999999; //get min index
        // for(var i=0;i<tvts.length;i++){
        //     if(tvts[i].index<minIdx)
        //         minIdx=tvts[i].index;
        // }
        //if we don't want to rebase, put minIdx = -1
        var lastRow = -1;

        var tvt_i = 0;
        //iterate through all values..
        for(var i=1;i<=max_id;i++){
            var idx = i;
            var showBox = true;
            if(tvt_i < sortedTvts.length) {
                element = sortedTvts[tvt_i];
                if(show_votes && (!element.admstatus || element.admstatus==constants.AdmissionValues.OUTSIDE)){
                    //element = null;
                    showBox = false;
                    if(element.index==idx)
                        tvt_i++;
                    element = null;
                }

                if(element && element.index==idx){
                    tvt_i ++;
                }else{
                    //if different, don't advance index and wait..
                    element = null;
                }
            }
            else
                element = null;



            // var idx =  element.index; //element.index- minIdx ;
            // var cardId = element.card_id;
            // var vote = element.vote;
            var x = x_offset + idx % squares_per_row * square_size;
            var row = Math.floor(idx / squares_per_row);
            var y = y_offset + row * square_size;

            var l = label_done[row];
            // if there is no row label, draw it, just once per row
            if(!l){
                ctx.fillStyle = "rgba(0, 0, 0, 1)";
                ctx.fillText(""+row * squares_per_row, 10, y + square_size);
                label_done[row] = true;
                //check last row
                if(lastRow < row -1){
                    //draw labels from lastRow to row-1
                    for(var r=lastRow+1;r<row;r++){
                        yy = y_offset + r * square_size;
                        ctx.fillText(""+r * squares_per_row, 10, yy + square_size);
                        label_done[row] = true;
                    }
                }
                lastRow = row
            }

            //set color
            if (element){
                ctx.fillStyle = colorFunction(element)
                ctx.fillRect(x, y, square_size, square_size);
                ctx.strokeStyle =  'black';
                ctx.strokeRect(x, y, square_size, square_size);
                ctx.strokeStyle = 'white';
                ctx.strokeRect(x+1, y+1, square_size, square_size);
                //add for tooltip
                televoter_list.push({x:x, y:y, size:square_size, card: element});
            }else{
                ctx.fillStyle =   '#E0E0E0';
                stroke1 = '#999';
                stroke2 = '#CCC';
                ctx.fillRect(x, y, square_size, square_size);
                ctx.strokeStyle =  stroke1;
                ctx.strokeRect(x, y, square_size, square_size);
                // ctx.strokeStyle = stroke2
                // ctx.strokeRect(x+1, y+1, square_size, square_size);
            }
            // ctx.fillStyle = element? colorFunction(element) : '#E0E0E0';
            // draw square
            // ctx.fillRect(x, y, square_size, square_size);
            // ctx.strokeStyle =  stroke1;
            // ctx.strokeRect(x, y, square_size, square_size);
            // ctx.strokeStyle = stroke2
            // ctx.strokeRect(x+1, y+1, square_size, square_size);
            // //add for tooltip
            // if(element)
            //     televoter_list.push({x:x, y:y, size:square_size, card: element});
        }

        return;

    };

    return {
        handleCanvasMove: handleCanvasMove,
        updateGrid: updateGrid,
        hideTooltip: hideTooltip,
        getCurrentTelevoter: getCurrentTelevoter,
    };
});
