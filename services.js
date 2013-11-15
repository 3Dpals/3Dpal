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
	 * USERS Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createUser
	 * ====
	 * Create a user (only if her/his name is unique).
	 * Parameters:
	 *	- name (String): 			User name
	 *	- password (String): 		Password
	 *	- email (String): 			Email
	 *	- cb (Function(bool)):		Callback
	 */
	function createUser(name, password, email, cb) {
		modelUser.findOne({ name: name }, function(err, user) {
			if (err || user) return cb(false); // User already exists
			
			var user = new modelUser({name: name, password: password, email: email});
			user.save(function(err) {
				if (err) cb(false);
				else cb (true);
			});
		});
	}
	/**
	 * serviceCreateUser
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- name (String):		User name 	- required
	 *		- password (String): 	Password 	- required
	 *		- email (String): 		Email 		- required
	 */
	function serviceCreateUser(req, resp) {
		logger.info("<Service> CreateUser.");
		var userData = parseRequest(req, ['name', 'password', 'email']);
		
		writeHeaders(resp);
		createUser(userData.name, userData.password, userData.email, function(success) { resp.end(JSON.stringify({ success: success })); });
	}
	 
	/**
	 * getUsers
	 * ====
	 * Returns a list of users, ordered by name.
	 * Parameters:
	 *	- limit (int): 					Number max of users to return
	 *	- offset (int): 				Number of the user to start with
	 *	- cb (Function(err, User[])):	Callback
	 */
	function getUsers(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelUser.find().sort({name: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelUser.find().sort({name: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * serviceGetUsers
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the user to start with	- optional
	 */
	function serviceGetUsers(req, resp) {
		logger.info("<Service> GetUsers.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getUsers(getData.limit, getData.offset, function (err, users) {
			if (err) error(2, err);
			else resp.end(JSON.stringify({ users: users })); 
		});
	}



	/*
	 * ------------------------------------------
	 * USER Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getUser
	 * ====
	 * Returns the User corresponding to the given username
	 * Parameters:
	 *	- name (String): 				Username
	 *	- cb (Function(err, User[])):	Callback
	 */
	function getUser(name, cb) {
		modelUser.findOne().where('name').equals(name).lean().exec(cb);
	}
	/**
	 * serviceGetUser
	 * ====
	 * Request Var:
	 * 		- name (string)		Username
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetUser(req, resp) {
		logger.info("<Service> GetUser.");
		var getData = parseRequest(req, ['name']);
		
		writeHeaders(resp);
		getUser(getData.name, function (err, user) {
			if (err) error(2, err);
			else resp.end(JSON.stringify({ user: user })); 
		});
	}
	 
	 
	 

	/*
	 * ------------------------------------------
	 * ROUTING
	 * ------------------------------------------
	 */
	 
	this.rest = {};
	this.rest['users']['POST'] = serviceGetUsers;
	this.rest['users']['GET'] = serviceCreateUser;
	this.rest['user/:name']['GET'] = serviceGetUser;
	 

	/*
	 * ------------------------------------------
	 * LOCAL MODULE METHODS
	 * ------------------------------------------
	 */
	 
	this.local = {};
	this.local.createUser = createUser;
	this.local.getUsers = getUsers;
	this.local.getUser = getUser;
	
	
	return this;
};
