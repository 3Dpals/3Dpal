//initialize

loadUserData();

//toggle between edit and read mode
function edit() {
	$('div#ProfileShow').attr('class', 'hide');
	$('div#ProfileEdit').attr('class', 'show');
	return false;
}
//toggle between edit and read mode
function back() {
	$('div#ProfileShow').attr('class', 'show');
	$('div#ProfileEdit').attr('class', 'hide');
	return true;
}

//save the EMail via the API
function saveEmail(userId) {
	var newEmail = $('#inputEmail').val();
	if (validateEmail(newEmail)) {
		$.ajax({
			url : 'api/user/' + userId + '/email',
			type : 'PUT',
			data : {
				email : newEmail
			},
			success : function (html) {
				if (html) {
					var myObjects = JSON.parse(html);
					$('div#returnstatus').append('<div class="alert alert-success alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Success!</strong> Email changed (' + myObjects.status + ').</div>');
					refreshEmail(newEmail);
				} else {
					$('div#returnstatus').append('<div class="alert alert-danger alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Error!</strong> Problem occured</div>');
				}
			}
		});
	} else {
		$('div#returnstatus').append('<div class="alert alert-danger alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Not valid!</strong> Email not valid.</div>');
	}
}

//save the password via the api
function savePassword(userId) {
	var newPassword = $('#inputPassword').val();
	if (validatePassword(newPassword, $('#inputPassword2').val())) {
		$.ajax({
			url : 'api/user/' + userId + '/password',
			type : 'PUT',
			data : {
				password : newPassword
			},
			success : function (html) {
				if (html) {
					var myObjects = JSON.parse(html);
					$('div#returnstatus').append('<div class="alert alert-success alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Success!</strong> Password changed (' + myObjects.status + ').</div>');
				} else {
					$('div#returnstatus').append('<div class="alert alert-danger alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Error!</strong> Problem occured</div>');
				}
			}
		});
	} else {
		$('div#returnstatus').append('<div class="alert alert-danger alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Not valid!</strong> Please check that you have entered and confirmed your password!</div>');
	}
}

//validate email
function validateEmail(email) {
	var atpos = email.indexOf("@");
	var dotpos = email.lastIndexOf(".");
	if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= email.length) {
		return false;
	}
	return true;
}

//validate password
function validatePassword(pwd1, pwd2) {
	if (pwd1 == "" || pwd1 != pwd2) {
		return false;
	}
	return true;
}

function loadUserData() {
	$.ajax({
		url : 'api/user/' + userId,
		type : 'GET',
		success : function (html) {
			if (html) {
				var myObjects = JSON.parse(html);
				populateHTML(myObjects);
			} else {
				$('div#returnstatus').append('<div class="alert alert-danger alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Error!</strong>User Profile not found</div>');
			}
		}
	});
}

function populateHTML(user) {
	refreshEmail(user.email);
}

function refreshEmail(email) {
	$('#profileImage').attr('src', "http://www.gravatar.com/avatar/" + md5(email));
	$('#showEmail').html(email);
	$('#inputEmail').attr('value', email);
}

function getToken(){
$.ajax({
		url : 'api/user/' + userId+"/token",
		type : 'GET',
		success : function (html) {
			if (html) {
				var myObjects = JSON.parse(html);
					$('#showAPIKey').html(myObjects.token);
					$('#editAPIKey').html(myObjects.token);
			}
		}
	});

}

