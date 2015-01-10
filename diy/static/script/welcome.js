var oldx = null;
var oldy = null;
var websocket = null;
var c
var ctx
$(document).ready(function() {
	setTimeout(wbstart, 100)

	$("#myCanvas").mousemove(function(event) {
		$("#cord").html(event.offsetX.toString() + ", " + event.offsetY.toString())
		if (event.which==1)	{
  			$("#ispress").html("yes")
  			oldx = event.offsetX
  			oldy = event.offsetY
  			setTimeout(draw, 100, event)
		}
		else {
			$("#ispress").html("no")
			
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
	websocket.send(JSON.stringify({
  					oldx: oldx,
  					oldy: oldy,
  					newx: newx,
  					newy: newy
	}));
	oldx = newx
  	oldy = newy
}

function wbstart() {
	var host = "ws://test3-sklaw.rhcloud.com/share";
	websocket = new WebSocket(host);
	websocket.onopen = function (evt) {
		$("#result").html("wb opened.")
	}
	websocket.onmessage = function(evt) {
		$("#result").html("wb onmessage.")
		data = $.parseJSON(evt.data)
		ctx.moveTo(data['oldx'],data['oldy']);
		ctx.lineTo(data['newx'],data['newy']);
		ctx.stroke();
	}
}