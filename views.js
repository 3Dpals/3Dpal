/**
 * =================
 * MODULE - Views
 * =================
 * Manage the client views
 */

var config = require("./config");
var logger = require("./logger");


/*
 * VIEW Index
 */
function viewIndex(req, res) {
	logger.debug("<View> Viewing index (User "+(req.user?req.user.username:'Unknown')+").");
	res.render('index', {title: "Main", username: (req.user?req.user.username:null)});
}

/*
 * VIEW SignIn
 */
function viewSignin(req, res) {
	logger.debug("<View> Viewing signin.");
	res.render('signin', {title: "Sign-In"});
}


/*
 * VIEW Login
 */
function viewLogin(req, res) {
	next = req.param("next", null);
	logger.info("<View> Viewing login page. Next is : " + next);
	res.render('login', {title: "Login", next: next, error: null});
}

/*
 * VIEW API
 */
function viewApi(req, res) {
	next = req.param("next", null);
	logger.info("<View> Viewing API");
	res.render('api', {title: "API"});
}

function dateToString(date) {
	var s = "";
	s += date.getFullYear();
	s += "/";
	s += twoDigits(date.getMonth()+1);
	s += "/";
	s += twoDigits(date.getDate());
	s += " ";
	s += twoDigits(date.getHours());
	s += ":";
	s += twoDigits(date.getMinutes());
	s += ":";
	s += twoDigits(date.getSeconds());
	return s;
}

function twoDigits(nb) {
	var retour = nb < 10 ? "0" + nb : "" + nb;
	return retour;
}


function viewNotfound(req, res) {
	logger.warn("<View> View not found : " + req.url);
	res.render('404', {title: "Page not found"});
}

function viewHelp(req, res) {
	logger.info("<View> Viewing help page.");
	res.render('help', {title: "Help"});
}

/*
 * VIEW Gallery
 */
function viewGallery(req, res) {
	logger.info("<View> Viewing gallery.");

//	res.render('gallery', {title: "Gallery", rest: rest});
	res.render('gallery', {title: "Gallery", rest: [{id:"00",name:"name00"},{id:"01",name:"name01"},{id:"02",name:"name02"},{id:"03",name:"name03"}]});
}

/*
 * VIEW User Profile
 */
function viewProfile(req, res) {
	logger.info("<View> Viewing User Profile.");
	var email = "johannes.baldinger@googlemail.com";
	email = email.trim();
	email = email.toLowerCase();
	var emailHash = require('crypto').createHash('md5').update(email).digest("hex");
//	res.render('profile', {title: "Profile", rest: rest});
	res.render('profile', {title: "Profile", rest: {id:"00",name:"Johannes Baldinger",email:email,emailHash :emailHash }});
}

exports.index = viewIndex;
exports.signin = viewSignin;
exports.login = viewLogin;
exports.notfound = viewNotfound;
exports.api = viewApi;
exports.help = viewHelp;
exports.gallery = viewGallery;
exports.profile = viewProfile;
