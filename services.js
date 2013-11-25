/**
 * =================
 * MODULE - Services
 * =================
 * REST and local services
 */

var	logger = require("./logger");
var	bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10;

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

		logger.error("Error function with message : " + result.error.msg)
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
			if (err || user) return cb(err, user); // User already exists
			
			var user = new modelUser({name: name, password: password, email: email});
			user.save(function(err) {
				logger.debug(err);
				cb (err, user);
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
		createUser(userData.name, userData.password, userData.email, function(err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 }));
		});
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
			modelUser.find({}, {__v:0, _id:0}).sort({name: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelUser.find({}, {__v:0, _id:0}).sort({name: 1}).skip(offset).lean().exec(cb);
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
			if (err) error(2, resp);
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
		modelUser.findOne({name: name}, {__v:0, _id:0}).lean().exec(cb);
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
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ user: user })); 
		});
	}
	 
	/**
	 * getUserId
	 * ====
	 * Returns the User's id
	 * Parameters:
	 *	- name (String): 				Username
	 *	- cb (Function(err, User[])):	Callback
	 */
	function getUserId(name, cb) {
		modelUser.findOne({name: name}, {__v:0, email:0, name:0}).lean().exec(cb);
	}
	/**
	 * serviceGetUserId
	 * ====
	 * Request Var:
	 * 		- name (string)		Username
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetUserId(req, resp) {
		logger.info("<Service> GetUserId.");
		var getData = parseRequest(req, ['name']);
		
		writeHeaders(resp);
		getUserId(getData.name, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ id: user._id })); 
		});
	}
	 
	/**
	 * getUserEmail
	 * ====
	 * Returns the User's email
	 * Parameters:
	 *	- name (String): 				Username
	 *	- cb (Function(err, User[])):	Callback
	 */
	function getUserEmail(name, cb) {
		modelUser.findOne({name: name}, {__v:0, _id:0, name:0}).lean().exec(cb);
	}
	/**
	 * serviceGetUserEmail
	 * ====
	 * Request Var:
	 * 		- name (string)		Username
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetUserEmail(req, resp) {
		logger.info("<Service> GetUserEmail.");
		var getData = parseRequest(req, ['name']);
		
		writeHeaders(resp);
		getUserEmail(getData.name, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ email: user.email })); 
		});
	}
	 
	/**
	 * deleteUser
	 * ====
	 * Delete the User corresponding to the given username
	 * Parameters:
	 *	- name (String): 				Username
	 *	- cb (Function(err, User[])):	Callback
	 */
	function deleteUser(name, cb) {
		modelUser.findOne({name: name}, {__v:0, _id:0}).lean().exec(function (err, item) {
			if (err){
				cb(err, null);
			}
              else {
					modelUser.remove(item, function (err, result) {
						cb(err, result);
					});
              }
       });
	}
	/**
	 * serviceDeleteUser
	 * ====
	 * Request Var:
	 * 		- name (string)		Username
	 * Request Parameters:
	 *		-none
	 */
	function serviceDeleteUser(req, resp) {
		logger.info("<Service> DeleteUser.");
		var getData = parseRequest(req, ['name']);
		
		writeHeaders(resp);
		deleteUser(getData.name, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
		});
	}
	
	
	/**
	 * updateUser
	 * ====
	 * Update the User corresponding to the given username
	 * Parameters:
	 *	- name (String): 			Username
	 *	- password (String): 		Password
	 *	- email (String): 			Email
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateUser(name, password, email, cb) {
		// generate a salt
		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if (err) { logger.error(err); return cb(err, null); }

			// hash the password using our new salt
			bcrypt.hash(password, salt, function(err, hash) {
				if (err) { logger.error(err); return cb(err, null); }

				modelUser.update({ name: name }, {password: hash, email: email}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
				});
			});
		});	
	}
	/**
	 * serviceUpdateUser
	 * ====
	 * Request Var:
	 * 		- name (string)		Username
	 * Request Parameters:
	 *		- password (String): 	Password 	- required
	 *		- email (String): 		Email 		- required
	 */
	function serviceUpdateUser(req, resp) {
		logger.info("<Service> UpdateUser.");
		var userData = parseRequest(req, ['name', 'password', 'email']);
		
		writeHeaders(resp);
		updateUser(userData.name, userData.password, userData.email, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
		});
	}
	
	
	/**
	 * updateUserEmail
	 * ====
	 * Update the email of the User corresponding to the given username
	 * Parameters:
	 *	- name (String): 		Username
	 *	- email (String): 		Email to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateUserEmail(name, email, cb) {
			modelUser.update({ name: name }, {email: email}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
			});
	}
	/**
	 * serviceUpdateUserEmail
	 * ====
	 * Request Var:
	 * 		- name (string)		Username
	 * Request Parameters:
	 *		- email (String): 		Email 		- required
	 */
	function serviceUpdateUserEmail(req, resp) {
		logger.info("<Service> UpdateUserEmail.");
		var userData = parseRequest(req, ['name', 'email']);
		
		writeHeaders(resp);
		updateUserEmail(userData.name, userData.email, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
		});
	}
	
	
	/**
	 * updateUserPassword
	 * ====
	 * Update the password of the User corresponding to the given username
	 * Parameters:
	 *	- name (String): 		Username
	 *	- password (String): 	Password to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateUserPassword(name, password, cb) {
		// generate a salt
		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if (err) { logger.error(err); return cb(err, null); }

			// hash the password using our new salt
			bcrypt.hash(password, salt, function(err, hash) {
				if (err) { logger.error(err); return cb(err, null); }

				modelUser.update({ name: name }, {password: hash}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
				});
			});
		});
	}
	/**
	 * serviceUpdateUserPassword
	 * ====
	 * Request Var:
	 * 		- name (string)		Username
	 * Request Parameters:
	 *		- email (String): 		Email 		- required
	 */
	function serviceUpdateUserPassword(req, resp) {
		logger.info("<Service> UpdateUserPassword.");
		var userData = parseRequest(req, ['name', 'password']);
		
		writeHeaders(resp);
		updateUserPassword(userData.name, userData.password, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
		});
	}
	 

	/*
	 * ------------------------------------------
	 * ROUTING
	 * ------------------------------------------
	 */
	 
	this.rest = {};
	this.rest['users'] = {
		'POST'	: serviceCreateUser,
		'GET'	: serviceGetUsers
	};
	this.rest['user/:name'] = {
		'GET'	: serviceGetUser,
		'DELETE': serviceDeleteUser,
		'PUT'	: serviceUpdateUser
	}
	this.rest['user/:name/id'] = {
		'GET'	: serviceGetUserId
	}
	this.rest['user/:name/email'] = {
		'GET'	: serviceGetUserEmail,
		'PUT'	: serviceUpdateUserEmail
	}
	this.rest['user/:name/password'] = {
		'PUT'	: serviceUpdateUserPassword
	}
	 

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
