var oldx = null;
var oldy = null;
var newx = null;
var newy = null;
var websocket = null;
var c
var ctx
var sendCon = []

var timerSend;
var timerRecord;

var clicking = false;
var lineAmount = 0;

var intentclose = false;



var reconnectTimes = 0

var canvasUsers = {}

var invitedAmount = 0

var recordF = 50

var waitingTime = 3000;

var missionqueue = []
var idle = true;

function level_1_display() {
	$(".level2").hide()
	$(".level1_1").hide()
	$(".level1").show()
}

function level_1_1_display() {
	$(".level2").hide()
	$(".level1").hide()
	$(".level1_1").show()
}

function level_2_display() {
	$(".level1_1").hide()
	$(".level1").hide()
	$(".level2").show()
}

function sendsendCon() {
	$("#clear").removeAttr("disabled")
	if (lineAmount > 500) {
		$("#errormessage").html("画的线最多500条哦 刷新重新画一次吧")
		sendCon = []
		return
	}
	$("#errormessage").html("")
	websocket.send(JSON.stringify({data:sendCon, type:"lines"}));
	canvasUsers[$('#name').html()]["lines"].push(sendCon)
	sendCon = []

}
$(document).ready(function() {
	window.WebSocket = window.WebSocket || window.MozWebSocket
	if (!window.WebSocket) {
		alert("这个浏览器不支持相关技术哦")
		return;
	}






	level_1_display()
	$("button").removeAttr("disabled")
	setTimeout(wbstart, 100)
	idle = true;
	$("p").each(function() {
		$(this).css({
			'MozUserSelect':'none',
			'webkitUserSelect':'none'
		}).attr('unselectable','on').bind('selectstart', function() {
			return false;
		});
	})


	$('#myCanvas').mousedown(function(event){
		$("#clear").attr("disabled", "disabled")
		clearInterval(timerRecord)
		clearTimeout(timerSend)
		$("#message").html("mousedown")
    	clicking = true;
    	
    	sendYet = false;
    	$("#ispress").html("yes")
    	$("#sendYet").html("准备发送笔迹")
    	var elm = $(this).offset();
    	oldx = event.pageX-elm.left;
  		oldy = event.pageY-elm.top;
		newx = event.pageX-elm.left;
  		newy = event.pageY-elm.top;

    	//$('.clickstatus').text('mousedown');
    	timerRecord = setInterval(draw, recordF)
	});

	

	$("#myCanvas").mousemove(function(event) {
		$("#message").html("mousemove")
		var elm = $(this).offset();
		if (clicking)	{
  			oldx = event.pageX-elm.left;
  			oldy = event.pageY-elm.top;
		}
		else {
			
		}
	})


	$("#myCanvas").mouseup(function(){
		clearInterval(timerRecord)
		$("#message").html("mouseup")
    	clicking = false;
    	$("#ispress").html("no")
		timerSend = setTimeout(function() {
			console.log('gonna shot.')
			
			sendsendCon()
			$("#sendYet").html("笔迹已发送")
		}, waitingTime)
    	//$('.clickstatus').text('mouseup');
    	//$('.movestatus').text('click released, no more move event');
	})

	

	$('#myCanvas').on({ 'touchstart' : function(e){
		$("#clear").attr("disabled", "disabled")
		clearInterval(timerRecord)
		$("#message").html("touchstart")
		clearTimeout(timerSend)
		$("#message").html("mousedown")
    	
    	sendYet = false;
    	$("#ispress").html("yes")
    	$("#sendYet").html("准备发送笔迹")

    	
    	e.preventDefault();
      	var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
      	var elm = $(this).offset();
      	var x = touch.pageX - elm.left;
      	var y = touch.pageY - elm.top;


    	newx = x
    	newy = y
    	oldx = x
  		oldy = y
    	//$('.clickstatus').text('mousedown');
    	timerRecord = setInterval(draw, recordF)
	} });

	$('#myCanvas').on({ 'touchmove' : function(e){
		e.preventDefault();
      	var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
      	var elm = $(this).offset();
      	var x = touch.pageX - elm.left;
      	var y = touch.pageY - elm.top;
      	
      	if(x < $(this).width() && x > 0){
          	if(y < $(this).height() && y > 0){
          		
          		oldx = x
  				oldy = y
                //CODE GOES HERE
                //console.log(touch.pageY+' '+touch.pageX);
          	}
      	}
      	//console.log(touch.pageY+' '+touch.pageX);

	} });

	$('#myCanvas').on({ 'touchend' : function(e){
		clearInterval(timerRecord)
		$("#message").html("mouseup")
    	
    	$("#ispress").html("no")
		timerSend = setTimeout(function() {
			console.log('gonna shot.')
			
			sendsendCon()
			$("#sendYet").html("笔迹已发送")
		}, waitingTime)
      	//console.log(touch.pageY+' '+touch.pageX);
	} });


	$('#clear').click(function(e) {
		lineAmount = 0
		$("#lineAmount").html(lineAmount.toString())
		$("button").attr("disabled", "disabled")
		websocket.send(JSON.stringify({data:"clear", type:"action"}));
	})
	$('#logout').click(function(e) {
		$("button").attr("disabled", "disabled")
		intentclose = true;
		websocket.close();
		document.cookie = 'username' + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		window.location.href = "/";
	})
	$("#createNewCanvas").click(function(){
		$("button").attr("disabled", "disabled")
		$.ajax({
			url:'/qualifyCanvasCreation',
			type: 'POST',
			data: {
				name:$("#name").html()
			},
			dataType: 'json',
			beforeSend: function(xhr, settings) {
				$("#createNewCanvas+span").html("checking")
			},
			success: function(data, status, xhr) {
				console.log(data["result"])
				if (data["result"] == 1) {
					$("#createNewCanvas+span").html("")

					level_1_1_display()
					if (invitedAmount == 0) {
						addOneInvitedUser()
					}		
				}
				else if (data["result"] == 0){
					$("#createNewCanvas+span").html("最多只能添加5个画布哦!你已经满啦,去删除一些吧")
				}
				else {
					$("#createNewCanvas+span").html("数据库出问题了,刷新一下页面看看")
				
				}
				$("button").removeAttr("disabled")
			},
			error: function(error) {
				console.log("error:")
				console.log(error)
			}
		})
	})
	$("#moreInvitedUser").click(addOneInvitedUser)
	$("#createcanvasname").change(function(){
		console.log("createcanvasname changed.")
		if (validInput($(this).val())) {
			$(this).attr("name", '1')
			$("#createcanvasname+span").html("ok")
		}
		else {
			$(this).attr("name", '0')
			$("#createcanvasname+span").html("名字非法哦 1到10个英文或数字谢谢")
		}
	})
    $("#submitInvitedUser").click(function() {
    	$("button").attr("disabled", "disabled")
    	var result = true
    	$(".invitedUserBlock input,#createcanvasname").each(function() {
    		console.log($(this).attr("name"))
    		if ($(this).attr("name") != '1') {
    			result = false
    		}
    	})
    	if(!result) {
    		$("#submitInvitedUser+span").html("表格有错误!请确认邀请人都变绿了")
    		$("button").removeAttr("disabled", "disabled")
    	}
    	else {
    		var invitedList = []
    		$(".invitedUserBlock input").each(function() {
    			console.log($(this).attr("name"))
    			invitedList.push($(this).val())
    		})
    		console.log(invitedList)
    		
    		$("#submitInvitedUser+span").html("submitting")
    		$.ajax({
    			url: '/createCanvas',
    			type: 'POST',
    			data: {
    				creator:$("#name").html(),
    				invitedList:JSON.stringify(invitedList),
    				canvasname:$("#createcanvasname").val()
    			},
    			dataType: 'json',
    			success: function(data, status, xhr) {
    				if (data["result"] == 1) {
						$("#submitInvitedUser+span").html("success")
						websocket.send(JSON.stringify({data:$("#createcanvasname").val(), type:"notifynewcanvas"}))
						websocket.send(JSON.stringify({data:$("#createcanvasname").val(), type:"entercanvas"}))
					}
					else if (data['result'] == 0){
						$("#submitInvitedUser+span").html("这个画布名已经被别人用了,换一个啦.")
						$("button").removeAttr("disabled", "disabled")
					}
					else {
						$("#submitInvitedUser+span").html("数据库出问题了,刷新一下页面看看")
					}
    			},
    			error: function(error) {
					console.log("error:")
					console.log(error)
				}
    		})
    	}
    })
	$("#gobacktocanvaslistpage").click(function() {
		$("button").attr("disabled", "disabled")
		console.log("gobacktocanvaslistpage click")
		window.location.href = "/";
	})
	$("#dismissCanvas").click(function() {
		$("button").attr("disabled", "disabled")
		websocket.send(JSON.stringify({data:"deleteCanvas", type:"action"}))
	})


	c = document.getElementById("myCanvas");

	ctx = c.getContext("2d");
	ctx.lineWidth = 5;
})

function addOneInvitedUser() {
		console.log("add one invited user")

		if (invitedAmount >= 4) {
			return;
		}
		var timer = null;
		var span = $("<span></span>")
		var div = $("<div></div>")
		$(div).attr('class', 'invitedUserBlock')
		var input = $("<input></input>")
		$(input).attr("type", "text")
		//input.exist = false;
		$(input).change(function() {
			$(span).html("checking")
			clearTimeout(timer)
			$(span).html("")
			$(input).css("background-color", "white")
			$(input).attr("name", '0')
			timer = setTimeout(function(){
				$(span).html("checking")
				if (!validInput($(input).val())) {
					$(span).html("名字非法哦 1到10个英文或数字谢谢")
					$(input).css("background-color", "red")
					$(input).attr("name", '0')
					return;
				}

				if ($(input).val() == $("#name").html()) {
					$(span).html("不要邀请自己谢谢!")
					$(input).css("background-color", "red")
					$(input).attr("name", '0')
					return;
				}



				var result = 0;
				$(".invitedUserBlock input").each(function() {
    				if ($(this).val() == input.val()) {
    					result++;
    				}
    			})
    			console.log("repeatcheck:"+result)
				if (result != 1) {
					$(span).html("这个名字之前填过了 不要重复邀请一个人哦")
					$(input).css("background-color", "red")
					$(input).attr("name", '0')
					return;
				}
				


				console.log("gonna ajax to check if a user exist")
				$.ajax({
				url: '/userexist',
				type: 'POST',
				data: {
						'name': $(input).val(),
				},
				dataType: 'json',
				success: function(data, status, xhr) {
						console.log(input.exist)
						if (data["result"] == 1) {
							$(span).html("ok")
							$(input).css("background-color", "green")
							$(input).attr("name", '1')
						}
						else if (data["result"] == 0) {
							$(span).html("this user does not exist!")
							$(input).css("background-color", "red")
							$(input).attr("name", '0')
						}
						else {
							$(span).html("数据库出错了 刷新一下谢谢")
							$(input).attr("name", '0')
						}
				},
				error: function(error) {
					console.log("error:")
					console.log(error)
				}
		});
			}, 0)
		})
		
		var button = $("<button></button>")
		$(button).html("-").click(function() {
			if (invitedAmount <= 1) {
				return
			}
			div.remove()
			invitedAmount--
		})

		$(div).append($(input))
		$(div).append($(button))
		$(div).append($(span))

		$(div).insertBefore("#submitInvitedUser");
		invitedAmount++
}

function draw() {
	ctx.moveTo(newx,newy);
	
	ctx.lineTo(oldx,oldy);
	ctx.stroke();

	lineAmount++;
	$("#lineAmount").html(lineAmount.toString())
	var obj = {}
	obj["oldx"] = oldx;
	obj["oldy"] = oldy;
	obj["newx"] = newx;
	obj["newy"] = newy;
	sendCon.push(obj)
	newx = oldx
	newy = oldy
}


function wbstart() {
	var host = "wss://test3-sklaw.rhcloud.com:8443/share";
	//var host = "ws://192.168.1.207:8080/share";
	idle = true;
	$("#wbstate").html('wbstate:'+"正努力连接到服务器")
	$("button").attr("disabled", "disabled")
	websocket = new WebSocket(host);
	websocket.onopen = function (evt) {
		$("#wbstate").html('wbstate:'+"刚刚建立连接  数据正在读入哦")
		$("#log").html('')
		websocket.send(JSON.stringify({data:document.cookie, type:"namecookie"}))
	}
	websocket.onmessage = function(evt) {
		$("#wbstate").html('wbstate:'+"onmessage")
		$("#log").html('')

		var data = $.parseJSON(evt.data)
		console.log(data["type"])
		console.log(data['data'])
		
		$("#onmessagetype").html('onmessage type:'+data["type"])

		missionqueue.push(data)
		console.log(idle)
		if (idle) {
			processMission()
		}
		else {
			console.log("things in queue:")
			console.log(missionqueue)
		}
		
		//
	}
	websocket.onerror = function(evt) {
		$("#wbstate").html('wbstate:'+"onerror")
		$("#log").html('wb error, 刷新一下谢谢')
	}
	websocket.onclose = function(evt) {
		if (intentclose) {
			$("#wbstate").html('wbstate:'+"onclose")
			$("#log").html('这是强制下线, 我不会帮你重连的哦, 重新登录吧.')
			return;
		}
		if (reconnectTimes > 6) {
			$("#wbstate").html('wbstate:'+"onclose")
			$("#log").html('尝试重连了6次还是不行,重新登录看看吧.')
			return;
		}
		reconnectTimes++
		$("#wbstate").html('wbstate:'+"onclose")
		$("#log").html('短线了!我现在帮你重连!')
		setTimeout(wbstart, 5000)
	}
}

function processMission() {
	if (missionqueue.length == 0) {
		console.log(missionqueue)
		console.log("nothing in the queue now: set idle")
		idle = true;
	}
	else {
		console.log("detect sth in the queue:")
		var data = missionqueue.shift()
		console.log(data)
		idle = false;
		onmessageHandler(data)
	}
}

function onmessageHandler(data) {
		if (data["type"] == 'lines') {
			//console.log(data["data"]) 
			//console.log("lines received.")
			linesHandler(data["data"]);
			//onmessageDone()
		}
		else if (data['type'] == 'clearsomeone') {
			console.log("gonna clear "+data['data']+"'s lines")
			canvasUsers[data['data']]['lines'] = []
			clearLines()
			$("button").removeAttr("disabled")
		}
		else if (data['type'] == "linepatch") {
			handleLinePatch(data["data"])
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
			else if (data['data'] == "gotoslash") {
				window.location.href = "/";
			}
		}
		else if (data['type'] == 'canvaslist') {
			$("button").removeAttr("disabled")
			canvasimin = data['data']['imin']
			canvasicreate = data['data']['icreate']
			
			displaycanvaslist(canvasimin, "#canvasimin")
			displaycanvaslist(canvasicreate, "#canvasicreate")
			$(".canvaslistelm").click(function() {
				$("button").attr("disabled", "disabled")
				lockAll()
				console.log("asking canvas:"+$(this).html())
				websocket.send(JSON.stringify({data:$(this).html(), type:"entercanvas"}))
			})
			onmessageDone()
		}
		else if (data['type'] == 'addcanvasoption') {
			$("#canvasimin").append("<button class='canvaslistelm'>"+data['data']+"</button>")

			$(".canvaslistelm").click(function() {
				lockAll()
				console.log("asking canvas:"+$(this).html())
				websocket.send(JSON.stringify({data:$(this).html(), type:"entercanvas"}))
			})

			$("button").removeAttr("disabled")
			onmessageDone()
		}
		else if (data['type'] == 'canvaspack') {
			lineAmount = 0
			level_2_display()
			$("button").removeAttr("disabled")
			var linespack = data['linespack']
			var canvasinfo = data['canvasinfo']
			var creator = canvasinfo["creator"]
			var members = canvasinfo['members']
			$("#canvasinfoBlock").empty()
			var p = $("<p></p>").html("画布名:"+canvasinfo['canvasname'])
			$("#canvasinfoBlock").append(p)
			p = $("<p></p>").html("画布主人:"+creator)
			$("#canvasinfoBlock").append(p)
			p = $("<p></p>").html("画布成员:"+members[0])
			for (var i = 1; i < members.length; i++) {
				p.html(p.html()+", "+members[i])
			}
			$("#canvasinfoBlock").append(p)



			members.push(creator)
			if ($('#name').html() == creator) {
				addDismissButton()
			}
			else {
				deleteDismissButton()
			}

			for (var i = 0; i < members.length; i++) {
				var obj = new User()
				obj['lines'] = []
				canvasUsers[members[i]] = obj
			}
			for (var i = 0; i < linespack.length; i++) {
				handleLinePatch(linespack[i])
			}
			onmessageDone()
		}
}



function addDismissButton() {
	console.log("in addDismissButton")
	$("#dismissCanvas").show()
}
function deleteDismissButton() {
	console.log("in deleteDismissButton")
	$("#dismissCanvas").hide()
}

function linesHandler(data) {
	console.log("in linesHandler")
	var i = 0;
	ctx.strokeStyle = 'black';
	console.log(i)
	console.log(data.length)
	var timer = setInterval(function() {
		if (i >= data.length) {
			clearInterval(timer)
			$("#result").html("wb waiting.")
			console.log("handled one lines")
			onmessageDone()
			return
		}
		$("#result").html("wb onmessage:"+data[i])
		ctx.moveTo(data[i]['oldx'],data[i]['oldy']);
		ctx.lineTo(data[i]['newx'],data[i]['newy']);
		
		ctx.stroke();
		console.log("drawed a line")
		//lineAmount++;
		//$("#lineAmount").html(lineAmount.toString())
		i++;
	}, recordF)
}

function clearLines() {
	console.log("in clearlines")
	var i = 255;
	var t = setInterval(function () {
		if (i < 0) {
			console.log("black-lize finished")
			clearInterval(t)
			ctx.beginPath();
			
			ctx.clearRect(0,0,c.width,c.height)
			
			redrawExcept()
			console.log("redraw finished")
			i = 0;
			var t2 = setInterval(function() {
				if (i == 255) {
					console.log("de-black-lize finished")
					clearInterval(t2)
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


function redrawExcept() {
	for (var p in canvasUsers) {
		drawLinesOfSomeone(canvasUsers[p]['lines'])
	}
}

function drawLinesOfSomeone(lineslist) {
	for (var i = 0; i < lineslist.length; i++) {
		drawOneLineFast(lineslist[i])
	}
}

function drawOneLineFast(linedata) {
	for (var i = 0; i < linedata.length; i++) {
		ctx.moveTo(linedata[i]['oldx'],linedata[i]['oldy']);
		ctx.lineTo(linedata[i]['newx'],linedata[i]['newy']);
		ctx.stroke();
	}
}


function onmessageDone() {
	$("#wbstate").html('wbstate:'+"message has been handled and it's idle now")
	processMission();
}




function displaycanvaslist(canvaslist, seletor) {
	console.log("in displaycanvaslist")
	$(seletor).empty();
	for (var i = 0; i < canvaslist.length; i++) {
		console.log("adding a canvas button")
		$(seletor).append("<button class='canvaslistelm'>"+canvaslist[i]+"</button>")
	}
	
}

function handleLinePatch(linepatch) {
	console.log("in handleLinePatch")
	
	if ( (linepatch['owner'] == $("#name").html()) ) {
		lineAmount += linepatch['data'].length
		$("#lineAmount").html(lineAmount.toString())
	}
	canvasUsers[linepatch['owner']]['lines'].push(linepatch['data'])

	linesHandler(linepatch['data'])
}

function User() {
	this['lines'] = [];
}

function lockAll() {

}

function validInput(str) {
	console.log(str)
	var re = /^(\w){1,10}$/
	var result = str.match(re)
	console.log(result)
	return result
}
