/**
 * =================
 * MAIN - Start
 * =================
 * App launcher
 */

var	express = require("express"),
	mongoose = require('mongoose'),
	http = require('http'),
	fs = require("fs"),
	engine = require('ejs-locals'),
	connect = require('connect'),
	passport = require('passport'),
	flash = require('connect-flash'),
	ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn,
	config = require("./config"),
	logger = require("./logger");

// Catch for all exception
process.on('uncaughtException', function (error) {
   logger.error(error.stack);
});

var securityActivated = config.getProperty("security.auth");
logger.warn("Security activated : " + securityActivated);

var sslActivated = config.getProperty("security.ssl");
logger.warn("SSL activated : " + sslActivated);


/* ------------------------
 * DB connection
 * ------------------------
 */
mongoose.connect(config.getProperty("db.uri"), function(err) {
  if (err) { logger.error(err); }
});

var	modelUser = require("./model/user")(mongoose).model,
	modelModel = require("./model/model")(mongoose).model,
	modelComment = require("./model/comment")(mongoose).model,
	modelFile = require("./model/file")(mongoose).model;

var	services = require("./services")(mongoose, modelUser, modelModel, modelComment, modelFile),
	views = require("./views");


/* ------------------------
 * HTML Server config
 * ------------------------
 */
var html;
if(sslActivated) {
	html = express({
		key: fs.readFileSync('security/server.key'),
		cert: fs.readFileSync('security/server.crt')
	});
} else {
	html = express();
}

html.configure(function() {
	// use ejs-locals for all ejs templates:
	html.engine('ejs', engine);
	html.use(express.bodyParser());
	html.use(express.methodOverride());
	html.use( express.cookieParser() );
	html.use(express.session({ secret: config.getProperty("session.secret"), cookie: { maxAge: 600000 } }));//changed from 1 min to 10 min.
	html.use(flash());
	html.use(passport.initialize());
	html.use(passport.session());
	html.use(express.static(__dirname + '/public'));
	html.use(html.router);
	html.set('views', __dirname + '/views');
	html.set('view engine', 'ejs');
});

// Services:
function ensureLoggedInApi(req, res, next) {
	if(req.param('token', null)) {
		passport.authenticate('localapikey', { session: false })(req, res, next);
	}
	else {
		ensureLoggedIn()(req, res, next);
	}
}

// Exception: Allow anonymous access to the API for POST /api/users :
html.post('/api/users', services.rest['users']['POST']);

for (var url in services.rest) {
	for (var action in services.rest[url]) {
		if (action == 'POST') {
			html.post('/api/'+url, ensureLoggedInApi, services.rest[url][action]);
			logger.debug('REST routing - '+url+' / POST defined');
		}
		else if (action == 'GET') {
			html.get('/api/'+url, ensureLoggedInApi, services.rest[url][action]);
			logger.debug('REST routing - '+url+' / GET defined');
		}
		else if (action == 'PUT') {
			html.put('/api/'+url, ensureLoggedInApi, services.rest[url][action]);
			logger.debug('REST routing - '+url+' / PUT defined');
		}
		else if (action == 'DELETE') {
			html.delete('/api/'+url, ensureLoggedInApi, services.rest[url][action]);
			logger.debug('REST routing - '+url+' / DELETE defined');
		}
		else {
			logger.error('Unknown HTTP action "'+action+'" for the URL '+url);
		}
	}
}

logger.warn("REST routes activated.");

// Authentification & Sessions:
require("./authentication")(passport, modelUser, config);

html.post('/login', function(req, res, next){
	passport.authenticate('local', passport.ensureAuthenticatedAndRedirectNext(req, res, next))(req, res, next);
});

html.post('/auth/openid',
	passport.authenticate('openid', { failureRedirect: '/openid' }),
	function(req, res) {
		res.redirect('/');
	});
html.get('/auth/openid/return', function(req, res, next){
	passport.authenticate('openid', passport.ensureAuthenticatedAndRedirectNext(req, res, next))(req, res, next);
});                         

html.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));
html.get('/auth/facebook/callback', function(req, res, next){
	passport.authenticate('facebook', passport.ensureAuthenticatedAndRedirectNext(req, res, next))(req, res, next);
});                            
     
html.get('/auth/google', passport.authenticate('google'));
html.get('/auth/google/return', function(req, res, next){
	passport.authenticate('google', passport.ensureAuthenticatedAndRedirectNext(req, res, next))(req, res, next);
});
							                             
html.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

// Different views of the HTML server :
viewHandler = {};
viewHandler["(index)?"] = {handler: views.index, secured: true};
viewHandler["signin"] = {handler: views.signin, secured: false};
viewHandler["login"] = {handler: views.login, secured: false};
viewHandler["openid"] = {handler: views.openid, secured: false};
viewHandler["help"] = {handler: views.help, secured: false};
viewHandler["gallery"] = {handler: views.gallery, secured: true};
viewHandler["mymodels"] = {handler: views.myModels, secured: true};
viewHandler["model"] = {handler: views.model, secured: true};
viewHandler["profile"] = {handler: views.profile, secured: true};
viewHandler["api"] = {handler: views.api, secured: false};
viewHandler["*"] = {handler: views.notfound, secured: false};

ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) { return next(); }

  // If the user is not authenticated, then we will start the authentication
  // process.  Before we do, let's store this originally requested URL in the
  // session so we know where to return the user later.

  req.session.redirectUrl = req.url;

  // Resume normal authentication...

  logger.info('User is not authenticated.');
  req.flash("warn", "You must be logged-in to do that.");
  res.redirect('/login');
}

for (var url in viewHandler) {
	(securityActivated) ?
		(viewHandler[url].secured) ?
			html.get("/"+url, ensureAuthenticated, viewHandler[url].handler)
			: html.get("/"+url, viewHandler[url].handler)
		: html.get("/"+url, viewHandler[url].handler)
}

logger.warn("HTML Server routes activated.");
var serverHtml = http.createServer(html);
serverHtml.listen(config.getProperty("http.port"));

logger.warn("HTML Server is listening.");
