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

var modelExample = require("./model/modelExample")(mongoose).model;

var	services = require("./services")(mongoose, modelExample),
	views = require("./views");

/* ------------------------
 * REST Server config
 * ------------------------
 */
var rest;
if(sslActivated) {
	rest = express({
		key: fs.readFileSync('security/server.key'),
		cert: fs.readFileSync('security/server.crt')
	});
} else {
	rest = express();
}
rest.configure(function() {
	rest.use(express.bodyParser()); // retrieves automatically req bodies
	rest.use(rest.router); // manually defines the routes
});

// Service: (TO IMPROVE WITH PROPER REST ROUTING)
serviceHandler = {};
serviceHandler["/createModelExample"] = services.rest.createModelExample;
//serviceHandler["/xxx"] = services.xxx;

for (var url in serviceHandler) {
	rest.post(url, serviceHandler[url]);
}

logger.warn("REST routes activated.");
var serverRest = http.createServer(rest);
serverRest.listen(config.getProperty("rest.port"));
logger.warn("REST server is listening.");


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

// Session config:
var	cookieParser = express.cookieParser(config.getProperty("session.secret")),
	sessionStore = new connect.middleware.session.MemoryStore();

html.configure(function() {
	// use ejs-locals for all ejs templates:
	html.engine('ejs', engine);
	html.use(express.bodyParser());
	html.use(express.static(__dirname + '/public'));
	html.set('views', __dirname + '/views');
	html.set('view engine', 'ejs');
	
	// Stuff needed for sessions
	html.use(cookieParser);
	html.use(express.session({ store: sessionStore }));
});

// Different views of the HTML server :
viewHandler = {};
viewHandler["/(index)?"] = views.index;
viewHandler["/login"] = views.login;
viewHandler["/signin"] = views.signin;
viewHandler["/help"] = views.help;

viewHandler["*"] = views.notfound;



for (var url in viewHandler) {
	(securityActivated) ? /* TO DO */0
						: html.get(url, viewHandler[url]);
}

logger.warn("HTML Server routes activated.");
var serverHtml = http.createServer(html);
serverHtml.listen(config.getProperty("http.port"));

logger.warn("HTML Server is listening.");