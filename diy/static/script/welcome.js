var oldx = null;
var oldy = null;
var websocket = null;
var c
var ctx
var sendYet = true
var sendCon = []
var timerSend;
$(document).ready(function() {
	setTimeout(wbstart, 100)

	$("#myCanvas").mousemove(function(event) {
		var timer4send;
		$("#cord").html(event.offsetX.toString() + ", " + event.offsetY.toString())
		if (event.which==1)	{
			clearTimeout(timerSend)
			sendYet = false;
  			$("#ispress").html("yes")
  			oldx = event.offsetX
  			oldy = event.offsetY
  			setTimeout(draw, 100, event)
		}
		else {
			$("#ispress").html("no")
			if (sendYet == false) {
				clearTimeout(timerSend)
				timerSend = setTimeout(function() {
					console.log('gonna shot.')
					websocket.send(JSON.stringify(sendCon));
					sendCon = []
				}, 1000)
				sendYet = true;
			}
		}
		if (sendYet) {
			$("#sendYet").html("sendYet")
		}
		else {
			$("#sendYet").html("wait to send")
		}
	})

	$('#myCanvas').on({ 'touchmove' : function(e){ /* do something... */ 
		e.preventDefault();
      	var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
      	var elm = $(this).offset();
      	var x = touch.pageX - elm.left;
      	var y = touch.pageY - elm.top;
      	$("#cord").html(x.toString() + ", " + y.toString())
      	//console.log(touch.pageY+' '+touch.pageX);

	} });


	c = document.getElementById("myCanvas");
	ctx = c.getContext("2d");

})

function draw(event) {
	ctx.moveTo(oldx,oldy);
	newx = event.offsetX
	newy = event.offsetY
	ctx.lineTo(newx,newy);
	ctx.stroke();

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
	websocket = new WebSocket(host);
	websocket.onopen = function (evt) {
		$("#result").html("wb opened.")
	}
	websocket.onmessage = function(evt) {
		$("#result").html("wb onmessage.")
		var data = $.parseJSON(evt.data)
		var i = 0;
		ctx.strokeStyle = 'black';
		timer = setInterval(function() {
			if (i >= data.length) {
				clearInterval(timer)
				return
			}
			ctx.moveTo(data[i]['oldx'],data[i]['oldy']);
			ctx.lineTo(data[i]['newx'],data[i]['newy']);
			ctx.strokeStyle = 'black';
			ctx.stroke();
			i++;
		}, 10)
		setTimeout(function(){

			timer = setInterval(function() {
				if (i >= data.length) {
					clearInterval(timer)
					return
				}
				ctx.moveTo(data[i]['oldx'],data[i]['oldy']);
				ctx.lineTo(data[i]['newx'],data[i]['newy']);
				ctx.strokeStyle = 'white';
				ctx.stroke();
				i++;
			})
		},10000)
	}
	websocket.onerror = function(evt) {
		console.log('web on error')
	}
}