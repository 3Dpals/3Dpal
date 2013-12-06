//init
var id = GetURLParameter('id');

//Load all comments
window.sessionStorage.setItem("LoadMoreComments", "true");
window.sessionStorage.setItem("noOfItems", 0);
getMoreComments();

//get model properties
$('div#loadmoreajaxloader').show();
$.ajax({
	url : "api/model/" + id,
	success : function (html) {
		if (html) {
			var myObjects = JSON.parse(html);
			$("#name").html(myObjects.name);
			$("#createdOn").html(myObjects.creationDate);
			$("#createdBy").html(myObjects.creator);
			$("#editName").attr('value', myObjects.name);
			$("#editReadPublic").prop('checked', myObjects.publicRead);
			$("#editWritePublic").prop('checked', myObjects.publicWrite);
			$("#showReadPublic").html( (myObjects.publicRead) ? "yes" : "no" );
			$("#showWritePublic").html( (myObjects.publicWrite) ? "yes" : "no");
			$("#showReadAccess").html(myObjects.readers);
			$("#showWriteAccess").html(myObjects.writers);
			var returnVal = new Array();
			for(var i=0; i<myObjects.readers.length; i++){
				var user = new Object();
				user.username= myObjects.readers[i];
				returnVal.push(user);
			}
			
			
			window.sessionStorage.setItem("prepopulate", JSON.stringify(returnVal));
			$('div#loadmoreajaxloader').hide();
		} else {
			$('div#loadmoreajaxloader').html('<center>Error.</center>');
		}
	}
});


function edit(){
	$('.formEdit').show();
	$('.formShow').hide();
	return false;
}

function save(){
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
			postedDate : Date.now()
		},
		success : function (html) {
			if (html) {
				$('div#NoMoreComments').remove();
				$('div#CommentReturnstatus').append('<div class="alert alert-success alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Success!</strong> Comment saved (' + html.status + ').</div>');
				getMoreComments();
			} else {
				$('div#CommentReturnstatus').append('<div class="alert alert-danger alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Error!</strong> Problem occured(' + html.status + ').</div>');
			}
		},
		error : function (jqXHR,  textStatus,  errorThrown ){
				$('div#CommentReturnstatus').append('<div class="alert alert-danger alert-dismissable"> <button type="button" class="close" data-dismiss="alert">&times;</button><strong>Error!</strong> Server Error(' + textStatus + ', +' +  errorThrown + ').</div>');
		}
	});
}
//convert JSON to html
function convertJSONinHTML(html) {
	var myObjects = JSON.parse(html).objects;
	var returnVal = "";
	if (myObjects == null || myObjects.length == 0) {
		window.sessionStorage.setItem("LoadMoreComments", "false");
		returnVal = '<div class="col-md-11 col-lg-11 col-sm-11" id="NoMoreComments"><center><h3>No more comments</h3></center><br></div>';
	} else {
		var noOfComments = window.sessionStorage.getItem("noOfItems");
		for (var i = 0; i < myObjects.length; i++) {
			returnVal += '<div class="panel panel-default"><div class="panel-heading"><h3 class="panel-title"><strong>';
			returnVal += myObjects[i].author;
			returnVal += '</strong> (';
			returnVal += myObjects[i].postedDate;
			returnVal += ')</h3></div><div class="panel-body">';
			returnVal += myObjects[i].text;
			returnVal += '</div></div>';
			noOfComments += 1;
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
