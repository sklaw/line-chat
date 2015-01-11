var oldx = null;
var oldy = null;
var websocket = null;
var c
var ctx
var sendCon = []
var lines = []
var timerSend;
var clicking = false;
var lineAmount = 0;
$(document).ready(function() {
	setTimeout(wbstart, 100)
	$("p").each(function() {
		$(this).css({
			'MozUserSelect':'none',
			'webkitUserSelect':'none'
		}).attr('unselectable','on').bind('selectstart', function() {
			return false;
		});
	})
	$('#myCanvas').mousedown(function(){
    	clicking = true;
    	clearTimeout(timerSend)
    	sendYet = false;
    	$("#ispress").html("yes")
    	$("#sendYet").html("wait to send")
    	//$('.clickstatus').text('mousedown');
	});

	$("#myCanvas").mouseup(function(){
    	clicking = false;
    	$("#ispress").html("no")
		clearTimeout(timerSend)
		timerSend = setTimeout(function() {
			console.log('gonna shot.')
			//sendCon.push("lines")
			websocket.send(JSON.stringify({data:sendCon, type:"lines"}));
			sendCon = []
			$("#sendYet").html("sendYet")
		}, 1000)
    	//$('.clickstatus').text('mouseup');
    	//$('.movestatus').text('click released, no more move event');
	})

	$("#myCanvas").mousemove(function(event) {
		var timer4send;
		
		if (clicking)	{
			
			
  			
  			var elm = $(this).offset();
  			event.offsetX = event.pageX-elm.left;
  			event.offsetY = event.pageY-elm.top;
  			oldx = event.offsetX
  			oldy = event.offsetY
  			//$("#cord").html(oldx.toString() + ", " + oldy.toString())
  			setTimeout(draw, 100, event)

		}
		else {
			
		}
	})

	$('#myCanvas').on({ 'touchmove' : function(e){ /* do something... */ 
		e.preventDefault();
      	var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
      	var elm = $(this).offset();
      	var x = touch.pageX - elm.left;
      	var y = touch.pageY - elm.top;
      	
      	if(x < $(this).width() && x > 0){
          	if(y < $(this).height() && y > 0){
          		clearTimeout(timerSend)
          		var event = {};
          		event.offsetX = x
          		event.offsetY = y
          		//$("#cord").html(event.offsetX.toString() + ", " + event.offsetY.toString())
          		oldx = event.offsetX
  				oldy = event.offsetY
          		setTimeout(draw, 100, event)
                //CODE GOES HERE
                //console.log(touch.pageY+' '+touch.pageX);
          	}
      	}
      	//console.log(touch.pageY+' '+touch.pageX);

	} });

	$('#myCanvas').on({ 'touchend' : function(e){ /* do something... */ 
		clearTimeout(timerSend)
		timerSend = setTimeout(function() {
			console.log('gonna shot.')
			sendCon.push("lines")
			websocket.send(JSON.stringify({data:sendCon, type:"lines"}));
			sendCon = []
		}, 1000)
      	//console.log(touch.pageY+' '+touch.pageX);
	} });


	$('#clear').click(function(e) {
		websocket.send(JSON.stringify({data:"clear", type:"action"}));
	})


	c = document.getElementById("myCanvas");

	ctx = c.getContext("2d");

})

function draw(event) {
	ctx.moveTo(oldx,oldy);
	var elm = $(event.target).offset();
  	event.offsetX = event.pageX-elm.left;
  	event.offsetY = event.pageY-elm.top;
	newx = event.offsetX
	newy = event.offsetY
	ctx.lineTo(newx,newy);
	ctx.stroke();
	lines.push([oldx, oldy, newx, newy])
	lineAmount++;
	$("#lineAmount").html(lineAmount.toString())
	var obj = {}
	obj["oldx"] = oldx;
	obj["oldy"] = oldy;
	obj["newx"] = newx;
	obj["newy"] = newy;
	sendCon.push(obj)
	
	oldx = newx
  	oldy = newy
}

function wbstart() {
	var host = "wss://test3-sklaw.rhcloud.com:8443/share";
	//var host = "ws://localhost:8080/share";
	websocket = new WebSocket(host);
	websocket.onopen = function (evt) {
		$("#result").html("wb opened.")
		websocket.send(JSON.stringify({data:$("#name").html(), type:"name"}))
	}
	websocket.onmessage = function(evt) {
		var data = $.parseJSON(evt.data)
		if (data["type"] == 'lines') {
			//console.log(data["data"]) 
			//console.log("lines received.")
			linesHandler(data["data"]);
		}
		else if (data["type"] == 'message') {
			$("#message").html(data["data"])
		}
		else if (data["type"] == "action") {
			if (data["data"] == "clear") {
				//console.log("clear")
				clearLines()
				
			}
		}
		//
	}
	websocket.onerror = function(evt) {
		$("#message").html('wb error')
	}
}

function linesHandler(data) {
	var i = 0;
	ctx.strokeStyle = 'black';
	timer = setInterval(function() {
		if (i >= data.length) {
			clearInterval(timer)
			$("#result").html("wb waiting.")
			return
		}
		$("#result").html("wb onmessage:"+data[i])
		ctx.moveTo(data[i]['oldx'],data[i]['oldy']);
		ctx.lineTo(data[i]['newx'],data[i]['newy']);
		ctx.strokeStyle = 'black';
		ctx.stroke();
		lines.push([data[i]['oldx'], data[i]['oldy'], data[i]['newx'], data[i]['newy']])
		//lineAmount++;
		//$("#lineAmount").html(lineAmount.toString())
		i++;
	}, 10)
}

function clearLines() {
	
	var i = 255;
	var t = setInterval(function () {
		if (i < 0) {
			lines = []
			clearInterval(t)
			ctx.beginPath();
				
			ctx.clearRect(0,0,c.width,c.height)
			i = 0;
			t = setInterval(function() {
				if (i == 255) {
					clearInterval(t)
				}
				str = i.toString()
				$("#myCanvas").css('background-color', 'rgb('+str+','+str+','+str+')'); 
				i += 15
			}, 10)
			return;
		}
		str = i.toString()
		$("#myCanvas").css('background-color', 'rgb('+str+','+str+','+str+')'); 
		i -= 15;
	}, 10)
}