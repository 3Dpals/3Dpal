//initialize
window.sessionStorage.setItem("LoadMoreModels", "true");
window.sessionStorage.setItem("noOfItems", 0);

//create a new model and redirect to edit
function NewModel() {
	var curDate = new Date();

	$.ajax({
		url : 'api/models',
		type : 'POST',
		data : {
			name : "New Model",
			file : "undefined",
			creator : username,
			creationDate : curDate,
			thumbnail : "undefined"
		},
		success : function (html) {
			var id = JSON.parse(html).id;
			//ToDo: update those fields, when api works
			//newFile(id, "file");
			//newFile(id, "thumbnail");
			var url = "model?edit=true&id=" + id;
			$(location).attr('href', url);
		}
	});
}

function newFile(modelID, field) {
	$.ajax({
		url : 'api/files',
		type : 'POST',
		data : {
			content : getImageText()
		},
		success : function (html) {
			var fileID = JSON.parse(html).id;
			$.ajax({
				url : 'api/model/' + modelID + "/" + field,
				type : 'PUT',
				data : field + "=" + fileID,
				success : function (html) {
				}
			});
		}
	});
}

//Loading 12 more models from the api
function getMoreModels(galleryURL) {
	var offset = window.sessionStorage.getItem("noOfItems");
	$('div#loadmoreajaxloader').show();
	$.ajax({
		url : galleryURL + "?limit=12&offset=" + offset,
		success : function (html) {
			if (html) {
				$("#postswrapper").append(convertJSONinHTML(html));
				$('div#loadmoreajaxloader').hide();
			} else {
				$('div#loadmoreajaxloader').html('<center>No more posts to show.</center>');
			}
		}
	});
}

//converting the JSON to html
function convertJSONinHTML(html) {
	var myObjects = JSON.parse(html).models;
	var returnVal = "";
	if (myObjects == null || myObjects.length == 0) {
		window.sessionStorage.setItem("LoadMoreModels", "false");
		console.log("No more Models to load.");
		returnVal = '<div class="col-md-11 col-lg-11 col-sm-11"><center><h3>No more Models</h3></center><br></div>';
	} else {
		var noOfModels = parseInt(window.sessionStorage.getItem("noOfItems"));
		console.log("Loaded " + myObjects.length + " Models.");
		for (var i = 0; i < myObjects.length; i++) {
			returnVal += '<div class="col-xs-6 col-sm-6 col-md-4 col-lg-3"><div class="thumbnail"><a href="model?id=';
			returnVal += myObjects[i]._id;
			returnVal += '"><center><img width="200px" hight="200px" src="thumbnail/';
			returnVal += myObjects[i].thumbnail;
			returnVal += '.png"></center></a><div class="caption"><h3>';
			returnVal += myObjects[i].name;
			returnVal += '</h3><p>created by ';
			returnVal += myObjects[i].creator;
			returnVal += ' <br>on ';
			returnVal += printDate(myObjects[i].creationDate);
			returnVal += '</p><a class="btn btn-default" href="model?id=';
			returnVal += myObjects[i]._id;
			returnVal += '" role="button">View details &raquo;</a></p></div></div></div>';
			noOfModels = parseInt(noOfModels)+ 1;
		}
		window.sessionStorage.setItem("noOfItems", noOfModels);
	}
	return returnVal;
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

//Event listening to the scrolling to load more models (endless scrolling)
$(window).scroll(function () {
	if (($(window).scrollTop() == $(document).height() - $(window).height()) && window.sessionStorage.getItem("LoadMoreModels") == "true") {
		getMoreModels(galleryURL);
	}
});

//back to top button
jQuery(document).ready(function () {
	var offset = 220;
	var duration = 500;
	jQuery(window).scroll(function () {
		if (jQuery(this).scrollTop() > offset) {
			jQuery('.back-to-top').fadeIn(duration);
		} else {
			jQuery('.back-to-top').fadeOut(duration);
		}
	});

	jQuery('.back-to-top').click(function (event) {
		event.preventDefault();
		jQuery('html, body').animate({
			scrollTop : 0
		}, duration);
		return false;
	})
});
