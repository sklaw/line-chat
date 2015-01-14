var url = "";
$(document).ready(function() {
	$('#summit').click(function(event) {
		$(this).attr("disabled", "disabled")
		$('#result').html("");
		if (!validInput($('#name').val())) {
			$('#result').html("名字非法哦 1到10个英文或数字谢谢");
			$(this).removeAttr("disabled")
			return;
		}
		if (!validInput($('#password').val())) {
			$('#result').html("密码非法哦 1到10个英文或数字谢谢");
			$(this).removeAttr("disabled")
			return;
		}



		$.ajax({
				url: url,
				type: 'POST',
				data: {
						'name': $('#name').val(),
						'password': $('#password').val()
				},
				dataType: 'json',
				beforeSend: function(xhr, settings) {
						$('#submit').attr('disable', 'disable');
				},
				success: function(data, status, xhr) {
						if (data["result"] == 1) {
							$('#result').html(data["message"])
							window.location.href = "/";
						}
						else {
							$("#summit").removeAttr("disabled")
							$('#result').html(data["message"])
						}
				},
				error: function(error) {
					console.log("error:")
					console.log(error)
				}
		});
	});

	$('input[name="option"]').click(function () {
		if (this.id == "signup") {
			$('#password').attr("type", "text")
			url = "/signup"
		}
		else {
			$('#password').attr("type", "password")
			url = "/login"
		}
	})
})


function validInput(str) {
	console.log(str)
	var re = /^(\w){1,10}$/
	var result = str.match(re)
	console.log(result)
	return result
}

