var oldx = null;
var oldy = null;
var websocket = null;
var c
var ctx
var sendCon = []

var timerSend;
var clicking = false;
var lineAmount = 0;

var intentclose = false;

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
		$("#message").html("mousedown")
    	clicking = true;
    	clearTimeout(timerSend)
    	sendYet = false;
    	$("#ispress").html("yes")
    	$("#sendYet").html("wait to send")
    	//$('.clickstatus').text('mousedown');
	});

	$("#myCanvas").mouseup(function(){
		$("#message").html("mouseup")
    	clicking = false;
    	$("#ispress").html("no")
		clearTimeout(timerSend)
		timerSend = setTimeout(function() {
			console.log('gonna shot.')
			
			websocket.send(JSON.stringify({data:sendCon, type:"lines"}));
			sendCon = []
			$("#sendYet").html("sendYet")
		}, 1000)
    	//$('.clickstatus').text('mouseup');
    	//$('.movestatus').text('click released, no more move event');
	})

	$("#myCanvas").mousemove(function(event) {
		$("#message").html("mousemove")
		
		if (clicking)	{
  			var elm = $(this).offset();
  			offsetX = event.pageX-elm.left;
  			offsetY = event.pageY-elm.top;

  			oldx = offsetX
  			oldy = offsetY

  			var recordX = oldx
  			var recordY = oldy

  			//$("#cord").html(oldx.toString() + ", " + oldy.toString())
  			setTimeout(draw, 100, recordX, recordY)

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
          		
          		oldx = x
  				oldy = y
          		setTimeout(draw, 100, x, y)
                //CODE GOES HERE
                //console.log(touch.pageY+' '+touch.pageX);
          	}
      	}
      	//console.log(touch.pageY+' '+touch.pageX);

	} });

	$('#myCanvas').on({ 'touchend' : function(e){ /* do something... */ 
		$("#message").html("touchend")
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
	$('#logout').click(function(e) {
		intentclose = true;
		websocket.close();
		document.cookie = 'username' + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		window.location.href = "/";
	})

	c = document.getElementById("myCanvas");

	ctx = c.getContext("2d");

})

function draw(recordX, recordY) {
	ctx.moveTo(oldx,oldy);
	
	ctx.lineTo(recordX,recordY);
	ctx.stroke();
	
	lineAmount++;
	$("#lineAmount").html(lineAmount.toString())
	var obj = {}
	obj["oldx"] = oldx;
	obj["oldy"] = oldy;
	obj["newx"] = recordX;
	obj["newy"] = recordY;
	sendCon.push(obj)
}


function wbstart() {
	var host = "wss://test3-sklaw.rhcloud.com:8443/share";
	//var host = "ws://192.168.1.207:8080/share";
	websocket = new WebSocket(host);
	websocket.onopen = function (evt) {
		$("#wbstate").html('wbstate:'+"onopen")
		$("#log").html('')
		websocket.send(JSON.stringify({data:document.cookie, type:"namecookie"}))
	}
	websocket.onmessage = function(evt) {
		$("#wbstate").html('wbstate:'+"onmessage")
		$("#log").html('')

		var data = $.parseJSON(evt.data)

		$("#onmessagetype").html('onmessage type:'+data["type"])
		if (data["type"] == 'lines') {
			//console.log(data["data"]) 
			//console.log("lines received.")
			linesHandler(data["data"]);
			//onmessageDone()
		}
		else if (data["type"] == 'message') {
			$("#message").html(data["data"])
			onmessageDone()
		}
		else if (data["type"] == 'errormessage') {
			$("#errormessage").html('error:'+data["data"])
			onmessageDone()
		}
		else if (data["type"] == "action") {
			if (data["data"] == "clear") {
				//console.log("clear")
				clearLines()
				//onmessageDone()
			}
			else if (data["data"] == "closeConnection") {
				intentclose = true
				document.cookie = 'username' + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
				websocket.close()
			}
		}
		//
	}
	websocket.onerror = function(evt) {
		$("#wbstate").html('wbstate:'+"onerror")
		$("#log").html('wb error, now try to reconnect')
		websocket.close()
		setTimeout(wbstart, 1000)
	}
	websocket.onclose = function(evt) {
		if (intentclose) {
			$("#wbstate").html('wbstate:'+"onclose")
			$("#log").html('force to be offline, this behavior is intended, so I WILL NOT try to reconnect. this may be cause by multiple-login. login again thanks.')
			return;
		}
		$("#wbstate").html('wbstate:'+"onclose")
		$("#log").html('offline, now try to reconnect')
		setTimeout(wbstart, 1000)
	}
}

function linesHandler(data) {
	var i = 0;
	ctx.strokeStyle = 'black';
	timer = setInterval(function() {
		if (i >= data.length) {
			clearInterval(timer)
			$("#result").html("wb waiting.")
			onmessageDone()
			return
		}
		$("#result").html("wb onmessage:"+data[i])
		ctx.moveTo(data[i]['oldx'],data[i]['oldy']);
		ctx.lineTo(data[i]['newx'],data[i]['newy']);
		
		ctx.stroke();
		
		//lineAmount++;
		//$("#lineAmount").html(lineAmount.toString())
		i++;
	}, 10)
}

function clearLines() {
	
	var i = 255;
	var t = setInterval(function () {
		if (i < 0) {
			
			clearInterval(t)
			ctx.beginPath();
				
			ctx.clearRect(0,0,c.width,c.height)
			i = 0;
			t = setInterval(function() {
				if (i == 255) {
					clearInterval(t)
					onmessageDone()
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

function onmessageDone() {
	$("#wbstate").html('wbstate:'+"message has been handled and it's idle now")
}