//initialize
initUsernameCache()

function getUsername(id){
	var cached = window.sessionStorage.getItem("User"+id);
	if (cached== null){
		var cached = window.sessionStorage.removeItem("User"+userId);
		initUsernameCache()
	}
	return cached;
}

function initUsernameCache(){
	var cached = window.sessionStorage.getItem("User"+userId);
	if (cached == null){
	$.ajax({
			url : "api/users",
			success : function (html) {
				var users = JSON.parse(html).users;
				for(var i=0; i<users.length; i++) {
					window.sessionStorage.setItem("User"+users[i]._id, users[i].username);
				}
				console.log("user cached");
			}
		});
	}else{
	console.log("user already cached");
	}
}


//Date to nice string
function printDate(newdate) {
	var temp = new Date(newdate);
	var dateStr =
		padStr(temp.getDate()) + "." +
		padStr(1 + temp.getMonth()) + "." +
		padStr(temp.getFullYear()) + " " +
		padStr(temp.getHours()) + ":" +
		padStr(temp.getMinutes());
	return dateStr;
}

function padStr(i) {
	return (i < 10) ? "0" + i : "" + i;
}

//image replace
function getImage(id, modelid){
	$.ajax({
			url : "api/file/"+id,
			data : {modelId : modelid },
			success : function (html) {
				var myObjects = JSON.parse(html);
				$("img#"+id).attr("src", "data:image/gif;base64,"+myObjects.content);
			}
		});
}