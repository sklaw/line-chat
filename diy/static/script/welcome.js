var oldx = null;
var oldy = null;
var websocket = null;
var c
var ctx
var sendYet = true
var sendCon = []
$(document).ready(function() {
	setTimeout(wbstart, 100)

	$("#myCanvas").mousemove(function(event) {
		$("#cord").html(event.offsetX.toString() + ", " + event.offsetY.toString())
		if (event.which==1)	{
			sendYet = false;
  			$("#ispress").html("yes")
  			oldx = event.offsetX
  			oldy = event.offsetY
  			setTimeout(draw, 100, event)
		}
		else {
			$("#ispress").html("no")
			if (sendYet == false) {
				console.log(JSON.stringify(sendCon))
				websocket.send(JSON.stringify(sendCon));
				sendCon = []
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
		data = $.parseJSON(evt.data)
		for (var i = 0; i < data.length; i++) {
			ctx.moveTo(data[i]['oldx'],data[i]['oldy']);
			ctx.lineTo(data[i]['newx'],data[i]['newy']);
			ctx.stroke();
		}
	}
	websocket.onerror = function(evt) {
		console.log('web on error')
	}
}