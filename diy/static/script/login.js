var url = "";
$(document).ready(function() {
	$('#summit').click(function(event) {
		$('#result').html("");
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
