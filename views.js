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
	logger.debug("<View> Viewing index (User "+req.session.username+").");
	res.render('index', {title: "Main", username: req.session.username});
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

exports.index = viewIndex;
exports.signin = viewSignin;
exports.login = viewLogin;
exports.notfound = viewNotfound;
exports.api = viewApi;
exports.help = viewHelp;
