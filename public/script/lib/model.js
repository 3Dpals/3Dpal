//init
var id = GetURLParameter('id');
var model;

//Load all comments
window.sessionStorage.setItem("LoadMoreComments", "true");
window.sessionStorage.setItem("noOfItems", 0);
$(document).ready(function ()
{
	getModelProperties();
	getMoreComments();
});

//after everything is loaded
function callOnce(){
	if ($("body").data("calledOnce") != "true") {
		var editMode = GetURLParameter('edit');
		if (editMode=="true"){
		$('#collapseOne').addClass('in');
			edit();
		}
		addTypeahead();	
		$("body").data("calledOnce","true")
	}
}
//get model properties
function getModelProperties() {
	$('div#loadmoreajaxloader').show();
	$.ajax({
		url : "api/model/" + id,
		success : function (html) {
			if (html) {
<<<<<<< HEAD
				model = JSON.parse(html);
				
				var sculptgl = new SculptGL();
				sculptgl.start(model);
	
				//$("#thumbnail").attr('id', model.thumbnail );
				//getImage(model.thumbnail);
				$("#name").html(model.name);
				$("#createdOn").html(printDate(model.creationDate));
				$("#createdBy").html(getUsername(model.creator)) ;
				$("#editName").attr('value', model.name);
				$("#editReadPublic").prop('checked', model.publicRead);
				$("#editWritePublic").prop('checked', model.publicWrite);
				$("#showReadPublic").html((model.publicRead) ? "yes" : "no");
				$("#showWritePublic").html((model.publicWrite) ? "yes" : "no");
				var accessLevel = getAccessUsers(model);
				$("#editName").data("oldVal", model.name);
				$("#editReadPublic").data("oldVal", model.publicRead);
				$("#editWritePublic").data("oldVal", model.publicWrite);
=======
				var myObjects = JSON.parse(html);
				$("#thumbnail").attr('id', myObjects.thumbnail );
				getImage(myObjects.thumbnail, id );
				$("#name").html(myObjects.name);
				$("#createdOn").html(printDate(myObjects.creationDate));
				$("#createdBy").html(getUsername(myObjects.creator)) ;
				$("#editName").attr('value', myObjects.name);
				$("#editReadPublic").prop('checked', myObjects.publicRead);
				$("#editWritePublic").prop('checked', myObjects.publicWrite);
				$("#showReadPublic").html((myObjects.publicRead) ? "yes" : "no");
				$("#showWritePublic").html((myObjects.publicWrite) ? "yes" : "no");
				var accessLevel = getAccessUsers(myObjects);
				$("#editName").data("oldVal", myObjects.name);
				$("#editReadPublic").data("oldVal", myObjects.publicRead);
				$("#editWritePublic").data("oldVal", myObjects.publicWrite);
>>>>>>> master
				//modify acces rights
				if (accessLevel>=3){
					$("#EditProperties").show();
				}
				if (accessLevel>=2){
					$("#EditFile").attr('href', 'editor?id='+id);
					$("#EditFile").show();
				}
				
				$('div#loadmoreajaxloader').hide();
			} else {
				$('div#loadmoreajaxloader').html('<center>Error.</center>');
			}
			callOnce();
		}
	});
}

function getAccessUsers(myObjects) {
	var accessLevel = 0;
	readerList = myObjects.readers;
	writerList = myObjects.writers;
	var returnVal = new Array();
	var returnString = "";
	for (var i = 0; i < readerList.length; i++) {
		var user = new Object();
		user.id = readerList[i];
		user.username = getUsername(readerList[i]);
		returnString +=getUsername(readerList[i]) + "<br>";
		returnVal.push(user);
		if(readerList[i]==userId) accessLevel = 1;
	}
	window.sessionStorage.setItem("prepopulateRead", JSON.stringify(returnVal));
	$("#showReadAccess").html(returnString);
	
	var returnVal = new Array();
	var returnString = "";
	for (var i = 0; i < writerList.length; i++) {
		var user = new Object();
		user.id = writerList[i];
		user.username = getUsername(writerList[i]);
		returnString +=getUsername(writerList[i]) + "<br>";
		returnVal.push(user);
		if(writerList[i]==userId) accessLevel = 2;
	}
	window.sessionStorage.setItem("prepopulateWrite", JSON.stringify(returnVal));
	$("#showWriteAccess").html(returnString);

	if(myObjects.publicWrite) accessLevel = 2 ;
	if(myObjects.creator==userId)accessLevel = 3;
	return accessLevel;
}

function edit() {
	$('.formEdit').show();
	$('.formShow').hide();
	return false;
}

function save() {
	saveModel();
	$('.formEdit').hide();
	$('.formShow').show();
	return false;
}

//get URL parameter
function GetURLParameter(sParam) {
	var sPageURL = window.location.search.substring(1);
	var sURLVariables = sPageURL.split('&');
	for (var i = 0; i < sURLVariables.length; i++) {
		var sParameterName = sURLVariables[i].split('=');
		if (sParameterName[0] == sParam) {
			return sParameterName[1];
		}
	}
};

/*
 ********************************************************************************************************************************************************
 *now comes the comments
 ********************************************************************************************************************************************************
 */

//Save new Comment
function saveNewComment() {
	var newComment = $('#newComment').val();
	$.ajax({
		url : 'api/comments',
		type : 'POST',
		data : {
			modelId : id,
			author : username,
			text : newComment,
			postedDate : new Date()
		},
		success : function (html) {
			if (html) {
				$('div#NoMoreComments').remove();
				$('div#CommentReturnstatus').append('<div class="alert alert-success alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Success!</strong> Comment saved (' + JSON.parse(html).status + ').</div>');
				getMoreComments();
			} else {
				$('div#CommentReturnstatus').append('<div class="alert alert-danger alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Error!</strong> Problem occured(' + JSON.parse(html).status + ').</div>');
			}
		},
		error : function (jqXHR, textStatus, errorThrown) {
			$('div#CommentReturnstatus').append('<div class="alert alert-danger alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Error!</strong> Server Error(' + textStatus + ', +' + errorThrown + ').</div>');
		}
	});
}
//convert JSON to html
function convertJSONinHTML(html) {
	var myObjects = JSON.parse(html).comments;
	var returnVal = "";
	if (myObjects == null || myObjects.length == 0) {
		window.sessionStorage.setItem("LoadMoreComments", "false");
		returnVal = '<div class="col-md-11 col-lg-11 col-sm-11" id="NoMoreComments"><center><h3>No more comments</h3></center><br></div>';
	} else {
		var noOfComments = parseInt(window.sessionStorage.getItem("noOfItems"));
		for (var i = 0; i < myObjects.length; i++) {
			returnVal += '<div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title"><strong>';
			returnVal += myObjects[i].author;
			returnVal += '</strong> (';
			returnVal += printDate(myObjects[i].postedDate);
			returnVal += ')</h3></div><div class="panel-body">';
			returnVal += myObjects[i].text;
			returnVal += '</div></div>';
			noOfComments = parseInt(noOfComments)+ 1;
		}
		window.sessionStorage.setItem("noOfItems", noOfComments);
	}
	return returnVal;
}
//load more comments
function getMoreComments() {
	var offset = window.sessionStorage.getItem("noOfItems");
	$('div#loadmoreajaxloader').show();
	$.ajax({
		url : "api/model/" + id + "/comments?limit=3&offset=" + offset,
		success : function (html) {
			if (html) {
				$("#comments").append(convertJSONinHTML(html));
				$('div#loadmoreajaxloader').hide();
			} else {
				$('div#loadmoreajaxloader').html('<center>No more Comments to show.</center>');
			}
		}
	});
}

//scroll event to load more comments (endless scrolling)
$(window).scroll(function () {
	if (($(window).scrollTop() == $(document).height() - $(window).height()) && window.sessionStorage.getItem("LoadMoreComments") == "true") {
		getMoreComments();
	}
});

//Typeahead
function addTypeahead(){
	$(".usertypeaheadRead").tokenInput("api/users", {
		propertyToSearch : "username",
		minChars : 1,
		prePopulate : JSON.parse(window.sessionStorage.getItem("prepopulateRead")),
		jsonContainer : "users",
		resultsFormatter : function (item) {
			return "<li>" + "<img src='http://www.gravatar.com/avatar/" + md5(item.email) + "' title='" + item.username + "' height='25px' width='25px' />" + "<div style='display: inline-block; padding-left: 10px;'><div class='full_name'>" + item.username + "</div><div class='email'>" + item.email + "</div></div></li>"
		},
		onAdd : function (item) {
			saveModelAccess("readers", item);
		},
		onDelete : function (item) {
			removeModelAccess("reader", item);
		}

	});
	$(".usertypeaheadWrite").tokenInput("api/users", {
		propertyToSearch : "username",
		minChars : 1,
		prePopulate : JSON.parse(window.sessionStorage.getItem("prepopulateWrite")),
		jsonContainer : "users",
		resultsFormatter : function (item) {
			return "<li>" + "<img src='http://www.gravatar.com/avatar/" + md5(item.email) + "' title='" + item.username + "' height='25px' width='25px' />" + "<div style='display: inline-block; padding-left: 10px;'><div class='full_name'>" + item.username + "</div><div class='email'>" + item.email + "</div></div></li>"
		},
		onAdd : function (item) {
			saveModelAccess("writers", item);
		},
		onDelete : function (item) {
			removeModelAccess("writer", item);
		}

	});
}

//Save the existing model
function saveModel() {

	if ($("#editName").data("oldVal") != $("#editName").val()) {
		saveModelProperty("name", $("#editName").val())
	}
	if ($("#editReadPublic").data("oldVal") != $("#editReadPublic").prop('checked')) {
		saveModelProperty("publicRead", $("#editReadPublic").prop('checked'))
	}
	if ($("#editWritePublic").data("oldVal") != $("#editWritePublic").prop('checked')) {
		saveModelProperty("publicWrite", $("#editWritePublic").prop('checked'))
	}
	//TODO: Reload current values in the doc, do not load it external via api.
	getModelProperties();
}

function saveModelProperty(propertyName, value) {
	$.ajax({
		url : 'api/model/' + id + "/" + propertyName,
		type : 'PUT',
		data : propertyName + "=" + value,
		success : function (html) {
			var status = JSON.parse(html).status;
			if (status == "ok") {
				console.log(propertyName + ": changed");
			} else {
				console.log(propertyName + ": change, Error:" + html);
			}
		}

	});
}

function saveModelAccess(propertyName, newItem) {
	var rightToWrite = (propertyName == "readers") ? false : true;
	$.ajax({
		url : 'api/model/' + id + "/" + propertyName,
		type : 'POST',
		data : {
			userId : newItem._id,
			rightToWrite : true
		},
		success : function (html) {
			var status = JSON.parse(html).status;
			if (status == "ok") {
				console.log(propertyName + ": changed");
			} else {
				console.log(propertyName + ": change, Error:" + html);
			}
		}

	});

}
function removeModelAccess(propertyName, newItem) {
	$.ajax({
		url : 'api/model/' + id + "/" + propertyName + "/" + newItem.id,
		type : 'DELETE',
		success : function (html) {
			var status = JSON.parse(html).status;
			if (status == "ok") {
				console.log(propertyName + ": deleted");
			} else {
				console.log(propertyName + ": delete, Error:" + html);
			}
		}

	});

}

function deleteModel() {
	$.ajax({
		url : 'api/model/' + id,
		type : 'DELETE',
		success : function (html) {
			var status = JSON.parse(html).status;
			if (status == "ok") {
				console.log("Model: deleted");
				$(location).attr('href', "mymodels");
			} else {
				console.log("Model: delete, Error:" + html);
			}
		}

	});
	return false;
}





