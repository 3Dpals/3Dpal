/**
 * =================
 * MODULE - Services
 * =================
 * REST and local services
 */

 var logger = require("./logger");

module.exports = function(mongoose, modelUser /* TODO: add other needed models */) {

	function error(code, resp) {
		var result = {};
		result.error = {};
		result.error.code = code;

		switch(code) {
			case 0:
				result.error.msg = "Couldn't parse the JSON";
				break;
			case 1:
				result.error.msg = "Unsupported HTTP/1.1 method for this service";
				break;
			case 2:
				result.error.msg = "DB error";
				break;
			default:
				result.error.msg = "Unknow error";
		}

		logger.error("Error function with message : " + result.error.msg);
		var jsonResult = JSON.stringify(result);
			resp.end(jsonResult);
	}

	// Adds the header indicating all went sucessfully.
	function writeHeaders(resp) {
		resp.header("Access-Control-Allow-Origin","*");
	}

	function parseRequest(req, names) {
		request = {}
		for (var n in names) {
			request[names[n]] = req.param(names[n], null);
		}
		return request;
	}


	/*
	 * ------------------------------------------
	 * USER - CRUD Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createUser
	 * ====
	 * Create a user (only if her/his username is unique).
	 * Parameters:
	 *	- username (String): 		User name
	 *	- password (String): 		Password
	 *	- cb (Function(bool)):		Callback
	 */
	function createUser(username, password, cb) {
		modelUser.findOne({ username: username }, function(err, user) {
			if (err || user) return cb(false); // User already exists
			
			var user = new modelUser({username: username, password: password});
			user.save(function(err) {
				if (err) cb(false);
				else cb (true);
			});
		});
	}
	function serviceCreateUser(req, resp) {
		logger.info("<Service> CreateUser.");
		var userData = parseRequest(req, ['username', 'password']);
		
		writeHeaders(resp);
		createUser(userData.username, userData.password, function(success) { resp.end(JSON.stringify({ success: success })); });
	}

	/* TODO: implement other services */
	
	
	this.rest = {};
	this.rest.createUser = serviceCreateUser;

	this.local = {};
	this.local.createUser = createUser;
	return this;
};
