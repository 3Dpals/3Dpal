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
	logger.debug("<View> Viewing index (User "+req.user.username+").");
	res.render('index', {title: "Main", username: req.user.username});
}

/*
 * VIEW SignIn
 */
function viewSignin(req, res) {
	logger.debug("<View> Viewing signin.");
	res.render('signin', {title: "Sign-In", username: (req.user? req.user.username: '')});
}


/*
 * VIEW Login
 */
function viewLogin(req, res) {
	next = req.param("next", null);
	logger.info("<View> Viewing login page. Next is : " + next);
	res.render('login', {title: "Login", next: next, error: null, username: (req.user? req.user.username: '')});
}

/*
 * VIEW OpenID
 */
function viewOpenID(req, res) {
	next = req.param("next", null);
	logger.info("<View> Viewing OpenID login page. Next is : " + next);
	res.render('openid', {title: "OpenID Authentification", next: next, error: null, username: (req.user? req.user.username: '')});
}

/*
 * VIEW API
 */
function viewApi(req, res) {
	next = req.param("next", null);
	logger.info("<View> Viewing API");
	res.render('api', {title: "API", username: (req.user? req.user.username: '')});
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
	res.render('404', {title: "Page not found", username: (req.user? req.user.username: '')});
}

function viewHelp(req, res) {
	logger.info("<View> Viewing help page.");
	res.render('help', {title: "Help", username: (req.user? req.user.username: '')});
}

/*
 * VIEW Gallery
 */
function viewGallery(req, res) {
	logger.info("<View> Viewing gallery.");
	res.render('gallery', {title: "Gallery", username: (req.user? req.user.username: '')});
}

/*
 * VIEW My Models Gallery
 */
function viewMyModels(req, res) {
	logger.info("<View> Viewing My Models.");
	res.render('mymodels', {title: "My Models", username: (req.user? req.user.username: '')});
}

/*
 * VIEW User Profile
 */
function viewProfile(req, res) {
	logger.info("<View> Viewing User Profile.");
	res.render('profile', {title: "Profile", username: (req.user? req.user.username: '')});
}

/*
 * VIEW Model
 */
function viewModel(req, res) {
	logger.info("<View> Viewing Model ("+req.url+")");
	res.render('model', {title: "Model", username: (req.user? req.user.username: '')});
}

exports.index = viewIndex;
exports.signin = viewSignin;
exports.login = viewLogin;
exports.openid = viewOpenID;
exports.notfound = viewNotfound;
exports.api = viewApi;
exports.help = viewHelp;
exports.gallery = viewGallery;
exports.myModels = viewMyModels;
exports.profile = viewProfile;
exports.model = viewModel;
