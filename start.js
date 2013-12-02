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

var	modelUser = require("./model/user")(mongoose).model,
	modelModel = require("./model/model")(mongoose).model,
	modelComment = require("./model/comment")(mongoose).model,
	modelFile = require("./model/file")(mongoose).model;

var	services = require("./services")(mongoose, modelUser, modelModel, modelComment, modelFile),
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
	html.use(express.methodOverride());
	html.use(html.router);
	html.use(express.static(__dirname + '/public'));
	html.set('views', __dirname + '/views');
	html.set('view engine', 'ejs');
	
	// Stuff needed for sessions
	html.use(cookieParser);
	html.use(express.session({ store: sessionStore }));
});

// Services:
for (var url in services.rest) {
	for (var action in services.rest[url]) {
		if (action == 'POST') {
			html.post('/api/'+url, services.rest[url][action]);
			logger.debug('REST routing - '+url+' / POST defined');
		}
		else if (action == 'GET') {
			html.get('/api/'+url, services.rest[url][action]);
			logger.debug('REST routing - '+url+' / GET defined');
		}
		else if (action == 'PUT') {
			html.put('/api/'+url, services.rest[url][action]);
			logger.debug('REST routing - '+url+' / PUT defined');
		}
		else if (action == 'DELETE') {
			html.delete('/api/'+url, services.rest[url][action]);
			logger.debug('REST routing - '+url+' / DELETE defined');
		}
		else {
			logger.error('Unknown HTTP action "'+action+'" for the URL '+url);
		}
	}
}

logger.warn("REST routes activated.");


// Different views of the HTML server :
viewHandler = {};
viewHandler["/(index)?"] = views.index;
viewHandler["/login"] = views.login;
viewHandler["/signin"] = views.signin;
viewHandler["/help"] = views.help;
viewHandler["/gallery"] = views.gallery;
viewHandler["/profile"] = views.profile;
viewHandler["/api"] = views.api;
viewHandler["*"] = views.notfound;

for (var url in viewHandler) {
	(securityActivated) ? /* TO DO */ html.get(url, viewHandler[url])
						: html.get(url, viewHandler[url]);
}

logger.warn("HTML Server routes activated.");
var serverHtml = http.createServer(html);
serverHtml.listen(config.getProperty("http.port"));

logger.warn("HTML Server is listening.");
