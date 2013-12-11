/**
 * =================
 * MODULE - Services
 * =================
 * REST and local services
 */

var	logger = require("./logger");
var	bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10;

module.exports = function(mongoose, modelUser, modelModel, modelComment, modelFile) {

	function error(code, resp, customMsg) {
		var result = {};
		result.error = {};
		result.error.code = code;
		result.status = 'nok';
		
		

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
			case 3:
				result.error.msg = "Operation denied";
				break;
			default:
				result.error.msg = customMsg?customMsg:"Unknow error";
		}

		logger.error("Error function with message : " + result.error.msg + (customMsg?' (err: '+customMsg+')':''));
		var jsonResult = JSON.stringify(result);
			resp.end(jsonResult);
	}
	
	// Adds the header indicating all went sucessfully.
	function writeHeaders(resp) {
		resp.header("Access-Control-Allow-Origin","*");
		resp.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		resp.header('Access-Control-Allow-Headers', 'Content-Type');
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
	 * PERMISSION CHECKING METHODS
	 * ------------------------------------------
	 */	

	/**
	 * hasPermissionUser
	 * ====
	 * Returns if the User can execute her/his operation on the chosen User instance.
	 * Parameters:
	 *	- writeFlag (bool): 		Write Flag - true if write operation asked, false if read only
	 *	- user (User): 				User
	 *	- userId (String): 			ID of the target User instance
	 *	- cb (Function(bool)):		Callback
	 */
	function hasPermissionUser(writeFlag, user, userId, cb) {
		cb((!writeFlag) || (user.id == userId)); // An User can read info about any other user, but can only edit its own.
	}
	
	/**
	 * hasPermissionModel
	 * ====
	 * Returns if the User can execute her/his operation on the chosen Model instance.
	 * Parameters:
	 *	- writeFlag (bool): 		Write Flag - true if write operation asked, false if read only
	 *	- user (User): 				User
	 *	- modelId (String): 		ID of the Model
	 *	- cb (Function(bool)):		Callback
	 */
	 function hasPermissionModel(writeFlag, user, modelId, cb) {
		 logger.error(modelId);
		modelModel.findById(modelId).exec(function(err, model) {
			if (err || !model) { cb(false); return; }
			
			cb(
				(model.creator == user.id)? // If the user is the creator, nothing else to check...
					true
				:
					writeFlag? 	// If permission to write asked
						model.publicWrite?
							true	// if writing is public, then OK
						:	(model.writers.indexOf(user.id) > -1)	// else we check if personal write right given
					:			// Else if only permission to read asked
						model.publicRead? 
							true 	// if reading is public, then OK
						:	(model.readers.indexOf(user.id) > -1)	// else we check if personal read right given
			);
		});
	}
	
	/**
	 * hasPermissionComment
	 * ====
	 * Returns if the User can execute her/his operation on the chosen Comment instance.
	 * Parameters:
	 *	- writeFlag (bool): 		Write Flag - true if write operation asked, false if read only
	 *	- user (User): 				User
	 *	- commentId (String): 		ID of the target Comment instance
	 *	- modelId (String): 		ID of the Model the Comment is about
	 *	- cb (Function(bool)):		Callback
	 */
	 function hasPermissionComment(writeFlag, user, commentId, modelId, cb) {
		modelComment.findById(commentId).exec(function(err, comment) {
			if (err || !comment) { cb(false); return; }
			
			if (!modelId) modelId = comment.modelId;
			if (writeFlag) { // If permission to write asked, we check if (s)he is the author:
				cb(user.id == comment.author);
			} else { // Else we just check if (s)he can access the model the comments are about:
				hasPermissionModel(false, user, modelId, cb);
			}
		});
	}
	
	/**
	 * hasPermissionFile
	 * ====
	 * Returns if the User can execute her/his operation on the chosen File instance.
	 * Parameters:
	 *	- writeFlag (bool): 		Write Flag - true if write operation asked, false if read only
	 *	- user (User): 				User
	 *	- fileId (String): 			ID of the target File instance
	 *	- modelId (String): 		ID of the Model the File is for
	 *	- cb (Function(bool)):		Callback
	 */
	 function hasPermissionFile(writeFlag, user, fileId, modelId, cb) {
		modelFile.findById(fileId).exec(function(err, file) {
			if (err || !file) { cb(false); return; }
			
			if (!modelId) modelId = file.modelId;
			hasPermissionModel(writeFlag, user, modelId, cb);
		});
	}

	/*
	 * ------------------------------------------
	 * USERS Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createUser
	 * ====
	 * Create a user (only if her/his userId is unique).
	 * Parameters:
	 *	- username (String): 		Username
	 *	- password (String): 		Password
	 *	- email (String): 			Email
	 *	- openId (String): 			OpenId
	 *	- facebookId (String): 		Facebook ID
	 *	- googleId (String): 		Google ID
	 *	- cb (Function(bool)):		Callback
	 */
	function createUser(username, password, email, openId, facebookId, googleId, cb) {
		var user = new modelUser({username: username, password: password, email: email, openId: openId, facebookId: facebookId, googleId: googleId, email: email});
		user.generateToken(username, function(err, token){
			user.token = token;
			user.save(function(err) {
				cb (err, 'ok');
			})
		});
	}
	/**
	 * serviceCreateUser
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- username (String): 		Username		- required
	 *	- password (String): 		Password		- required
	 *	- email (String): 			Email			- required
	 *	- openId (String): 			OpenId			- required
	 *	- facebookId (String): 		Facebook ID 	- required
	 */
	function serviceCreateUser(req, resp) {
		logger.info("<Service> CreateUser.");
		var reqData = parseRequest(req, ['username', 'password', 'email', 'openId', 'facebookId', 'googleId']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, null, function(permOk) {
			if (permOk) {
				createUser(reqData.username, reqData.password, reqData.email, reqData.openId, reqData.facebookId, reqData.googleId, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status }));
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * getUsers
	 * ====
	 * Returns a list of users, ordered by userId.
	 * Parameters:
	 *	- contain (String): 			String the usernames must contain (Regex - can be left null)
	 *	- limit (int): 					Number max of users to return
	 *	- offset (int): 				Number of the user to start with
	 *	- cb (Function(err, User[])):	Callback
	 */
	function getUsers(contain, limit, offset, cb) {
		if (!offset) offset = 0;
		if (contain) {
			var regex = new RegExp(contain, 'i');
			if (limit) {
				modelUser.find({username: regex}, {__v:0}).sort({username: 1}).skip(offset).limit(limit).lean().exec(cb);
			}
			else {
				modelUser.find({username: regex}, {__v:0}).sort({username: 1}).skip(offset).lean().exec(cb);
			}
		} else {
			if (limit) {
				modelUser.find({}, {__v:0}).sort({username: 1}).skip(offset).limit(limit).lean().exec(cb);
			}
			else {
				modelUser.find({}, {__v:0}).sort({username: 1}).skip(offset).lean().exec(cb);
			}
		}
	}
	/**
	 * serviceGetUsers
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- contain (String): String the usernames must contain	- optional
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the user to start with	- optional
	 */
	function serviceGetUsers(req, resp) {
		logger.info("<Service> GetUsers.");
		var reqData = parseRequest(req, ['contain', 'limit', 'offset']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, null, function(permOk) {
			if (permOk) {
				getUsers(reqData.contain, reqData.limit, reqData.offset, function (err, users) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ users: users })); 
				});
			} else {
				error(3, resp);
			}
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
	 * Returns the User corresponding to the given id
	 * Parameters:
	 *	- userId (String): 				ID
	 *	- cb (Function(err, User[])):	Callback
	 */
	function getUser(userId, cb) {
		modelUser.findById(userId, {__v:0}).lean().exec(cb);
	}
	/**
	 * serviceGetUser
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetUser(req, resp) {
		logger.info("<Service> GetUser.");
		var reqData = parseRequest(req, ['userId']);
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				getUser(reqData.userId, function (err, user) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify(user)); 
				});
			} else {
				error(3, resp);
			}
		});
		
	}
	 
	/**
	 * getUserUsername
	 * ====
	 * Returns the User's name
	 * Parameters:
	 *	- userId (String): 				ID
	 *	- cb (Function(err, User[])):	Callback
	 */
	function getUserUsername(userId, cb) {
		modelUser.findById(userId).select('username').lean().exec(cb);
	}
	/**
	 * serviceGetUserUsername
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetUserUsername(req, resp) {
		logger.info("<Service> GetUserUsername.");
		var reqData = parseRequest(req, ['userId']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				getUserUsername(reqData.userId, function (err, user) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ username: user.username })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * getUserEmail
	 * ====
	 * Returns the User's email
	 * Parameters:
	 *	- userId (String): 				ID
	 *	- cb (Function(err, User[])):	Callback
	 */
	function getUserEmail(userId, cb) {
		modelUser.findById(userId).select('email').lean().exec(cb);
	}
	/**
	 * serviceGetUserEmail
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetUserEmail(req, resp) {
		logger.info("<Service> GetUserEmail.");
		var reqData = parseRequest(req, ['userId']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				getUserEmail(reqData.userId, function (err, user) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ email: user.email })); 
				});
			} else {
				error(3, resp);
			}
		});
		
	}
	 
	 
	/**
	 * getUserToken
	 * ====
	 * Returns the User's token
	 * Parameters:
	 *	- userId (String): 				ID
	 *	- cb (Function(err, User[])):	Callback
	 */
	function getUserToken(userId, cb) {
		modelUser.findById(userId).select('token').lean().exec(cb);
	}
	/**
	 * serviceGetUserToken
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetUserToken(req, resp) {
		logger.info("<Service> GetUserToken.");
		var reqData = parseRequest(req, ['userId']);
		
		writeHeaders(resp);
		hasPermissionUser(true, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				getUserToken(reqData.userId, function (err, user) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ token: user.token })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * getUserOpenId
	 * ====
	 * Returns the User's openId
	 * Parameters:
	 *	- userId (String): 				ID
	 *	- cb (Function(err, User[])):	Callback
	 */
	function getUserOpenId(userId, cb) {
		modelUser.findById(userId).select('openId').lean().exec(cb);
	}
	/**
	 * serviceGetUserOpenId
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetUserOpenId(req, resp) {
		logger.info("<Service> GetUserOpenId.");
		var reqData = parseRequest(req, ['userId']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				getUserOpenId(reqData.userId, function (err, user) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ openId: user.openId })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	
	/**
	 * getUserFacebookId
	 * ====
	 * Returns the User's facebookId
	 * Parameters:
	 *	- userId (String): 				ID
	 *	- cb (Function(err, User[])):	Callback
	 */
	function getUserFacebookId(userId, cb) {
		modelUser.findById(userId).select('facebookId').lean().exec(cb);
	}
	/**
	 * serviceGetUserFacebookId
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetUserFacebookId(req, resp) {
		logger.info("<Service> GetUserFacebookId.");
		var reqData = parseRequest(req, ['userId']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				getUserFacebookId(reqData.userId, function (err, user) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ facebookId: user.facebookId })); 
				});
			} else {
				error(3, resp);
			}
		});
		
	}
	 
	/**
	 * getUserGoogleId
	 * ====
	 * Returns the User's googleId
	 * Parameters:
	 *	- userId (String): 				ID
	 *	- cb (Function(err, User[])):	Callback
	 */
	function getUserGoogleId(userId, cb) {
		modelUser.findById(userId).select('googleId').lean().exec(cb);
	}
	/**
	 * serviceGetUserGoogleId
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetUserGoogleId(req, resp) {
		logger.info("<Service> GetUserGoogleId.");
		var reqData = parseRequest(req, ['userId']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				getUserGoogleId(reqData.userId, function (err, user) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ googleId: user.googleId })); 
				})
			} else {
				error(3, resp);
			}
		});;
	}
	 
	/**
	 * deleteUser
	 * ====
	 * Delete the User corresponding to the given userId
	 * Parameters:
	 *	- userId (String): 				ID
	 *	- cb (Function(err, User[])):	Callback
	 */
	function deleteUser(userId, cb) {
		modelUser.findById(userId).exec(function (err, item) {
			if (err){
				cb(err, null);
			}
              else {
					modelUser.remove(item, function (err, result) {
						cb(err, 'ok');
					});
              }
       });
	}
	/**
	 * serviceDeleteUser
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceDeleteUser(req, resp) {
		logger.info("<Service> DeleteUser.");
		var reqData = parseRequest(req, ['userId']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				deleteUser(reqData.userId, function (err, user) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	
	
	/**
	 * updateUser
	 * ====
	 * Update the User corresponding to the given userId
	 * Parameters:
	 *	- userId (String): 			ID
	 *	- username (String): 		Username
	 *	- password (String): 		Password
	 *	- email (String): 			Email
	 *	- openId (String): 			OpenId
	 *	- facebookId (String): 		Facebook ID
	 *	- googleId (String): 		Google ID
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateUser(userId, username, password, email, openId, facebookId, googleId, cb) {
		// generate a salt
		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if (err) { logger.error(err); return cb(err, null); }

			// hash the password using our new salt
			bcrypt.hash(password, salt, function(err, hash) {
				if (err) { logger.error(err); return cb(err, null); }

				modelUser.findByIdAndUpdate(userId, {username: username, password: hash, email: email, openId: openId, facebookId: facebookId, googleId: googleId, email: email}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
				});
			});
		});	
	}
	/**
	 * serviceUpdateUser
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *	- username (String): 		Username		- required
	 *	- password (String): 		Password		- required
	 *	- email (String): 			Email			- required
	 *	- openId (String): 			OpenId			- required
	 *	- facebookId (String): 		Facebook ID 	- required
	 */
	function serviceUpdateUser(req, resp) {
		logger.info("<Service> UpdateUser.");
		var reqData = parseRequest(req, ['userId', 'username', 'password', 'email', 'openId', 'facebookId', 'googleId']);
		if (!reqData.password) { error(10, resp, 'Password required'); return; }
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				updateUser(reqData.userId, reqData.username, reqData.password, reqData.email, reqData.openId, reqData.facebookId, reqData.googleId, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	
	
	/**
	 * updateUserEmail
	 * ====
	 * Update the email of the User corresponding to the given userId
	 * Parameters:
	 *	- userId (String): 		ID
	 *	- email (String): 		Email to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateUserEmail(userId, email, cb) {
			modelUser.findByIdAndUpdate(userId, {email: email}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateUserEmail
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		- email (String): 		Email 		- required
	 */
	function serviceUpdateUserEmail(req, resp) {
		logger.info("<Service> UpdateUserEmail.");
		var reqData = parseRequest(req, ['userId', 'email']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				updateUserEmail(reqData.userId, reqData.email, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	
	
	/**
	 * updateUserUsername
	 * ====
	 * Update the username of the User corresponding to the given userId
	 * Parameters:
	 *	- userId (String): 		ID
	 *	- username (String): 		Username to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateUserUsername(userId, username, cb) {
			modelUser.findByIdAndUpdate(userId, {username: username}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateUserUsername
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		- username (String): 		Username 		- required
	 */
	function serviceUpdateUserUsername(req, resp) {
		logger.info("<Service> UpdateUserUsername.");
		var reqData = parseRequest(req, ['userId', 'username']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				updateUserUsername(reqData.userId, reqData.username, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	
	/**
	 * updateUserOpenId
	 * ====
	 * Update the openId of the User corresponding to the given userId
	 * Parameters:
	 *	- userId (String): 		ID
	 *	- openId (String): 		OpenId to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateUserOpenId(userId, openId, cb) {
			modelUser.findByIdAndUpdate(userId, {openId: openId}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateUserOpenId
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		- openId (String): 		OpenId 		- required
	 */
	function serviceUpdateUserOpenId(req, resp) {
		logger.info("<Service> UpdateUserOpenId.");
		var reqData = parseRequest(req, ['userId', 'openId']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				updateUserOpenId(reqData.userId, reqData.openId, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	
	/**
	 * updateUserFacebookId
	 * ====
	 * Update the facebookId of the User corresponding to the given userId
	 * Parameters:
	 *	- userId (String): 		ID
	 *	- facebookId (String): 		FacebookId to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateUserFacebookId(userId, facebookId, cb) {
			modelUser.findByIdAndUpdate(userId, {facebookId: facebookId}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateUserFacebookId
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		- facebookId (String): 		FacebookId 		- required
	 */
	function serviceUpdateUserFacebookId(req, resp) {
		logger.info("<Service> UpdateUserFacebookId.");
		var reqData = parseRequest(req, ['userId', 'facebookId']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				updateUserFacebookId(reqData.userId, reqData.facebookId, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	
	/**
	 * updateUserGoogleId
	 * ====
	 * Update the googleId of the User corresponding to the given userId
	 * Parameters:
	 *	- userId (String): 		ID
	 *	- googleId (String): 		GoogleId to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateUserGoogleId(userId, googleId, cb) {
			modelUser.findByIdAndUpdate(userId, {googleId: googleId}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateUserGoogleId
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		- googleId (String): 		GoogleId 		- required
	 */
	function serviceUpdateUserGoogleId(req, resp) {
		logger.info("<Service> UpdateUserGoogleId.");
		var reqData = parseRequest(req, ['userId', 'googleId']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				updateUserGoogleId(reqData.userId, reqData.googleId, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	
	/**
	 * updateUserPassword
	 * ====
	 * Update the password of the User corresponding to the given userId
	 * Parameters:
	 *	- userId (String): 		ID
	 *	- password (String): 	Password to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateUserPassword(userId, password, cb) {
		// generate a salt
		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if (err) { logger.error(err); return cb(err, null); }

			// hash the password using our new salt
			bcrypt.hash(password, salt, function(err, hash) {
				if (err) { logger.error(err); return cb(err, null); }

				modelUser.findByIdAndUpdate(userId, {password: hash}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
				});
			});
		});
	}
	/**
	 * serviceUpdateUserPassword
	 * ====
	 * Request Var:
	 * 		- userId (string)		ID
	 * Request Parameters:
	 *		- email (String): 		Email 		- required
	 */
	function serviceUpdateUserPassword(req, resp) {
		logger.info("<Service> UpdateUserPassword.");
		var reqData = parseRequest(req, ['userId', 'password']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				updateUserPassword(reqData.userId, reqData.password, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	 
	/*
	 * ------------------------------------------
	 * MODELS Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createModel
	 * ====
	 * Create a Model
	 * Parameters:
	 *	- name (String): 			Model name
	 *	- file (String): 			Filename
	 *  - creator (String):			ID of the Creator
	 *	- creationDate (Date): 		Date of creation
	 *  - thumbnail (String):		Filename of the thumbnail
	 *	- tags (String[]): 			Tags (optional)
	 *	- cb (Function(bool)):		Callback
	 */
	function createModel(name, file, creator, creationDate, thumbnail, tags, cb) {
		var obj = new modelModel({name: name, file: file, creator: creator,  creationDate: creationDate,  thumbnail: thumbnail,  tags: tags});
		obj.save(function(err) {
			if (err) logger.error(err);
			cb (err, obj);
		});
	}
	/**
	 * serviceCreateModel
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- name (String): 			Model name					- required
	 *	- file (String): 			Filename					- required
	 *  - creator (String):			ID of the Creator		- required
	 *	- creationDate (Date): 		Date of creation			- required
	 *  - thumbnail (String):		Filename of the thumbnail	- required
	 *	- tags (String[]): 			Tags (optional)				- optional
	 */
	function serviceCreateModel(req, resp) {
		logger.info("<Service> CreateModel.");
		var reqData = parseRequest(req, ['name', 'file', 'creator', 'creationDate', 'thumbnail', 'tags']);
		writeHeaders(resp);
		hasPermissionUser(false, req.user, null, function(permOk) {
			if (permOk) {
				createModel(reqData.name, reqData.file, reqData.creator, reqData.creationDate, reqData.thumbnail, reqData.tags, function(err, model) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: 'ok', id: model.id }));
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * getModels
	 * ====
	 * Returns a list of models, ordered by name.
	 * Parameters:
	 *	- limit (int): 					Number max of Model to return
	 *	- offset (int): 				Number of the Model to start with
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getModels(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelModel.find({}, {__v:0}).sort({name: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelModel.find({}, {__v:0}).sort({name: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * serviceGetModels
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return					- optional
	 *		- offset (int): 	Number of the Model to start with	- optional
	 */
	function serviceGetModels(req, resp) {
		logger.info("<Service> GetModels.");
		var reqData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		hasPermissionUser(true, req.user, null, function(permOk) {
			if (permOk) {
				getModels(reqData.limit, reqData.offset, function (err, objects) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ objects: objects })); 
				});
			} else {
				error(3, resp);
			}
		});
	}



	/*
	 * ------------------------------------------
	 * MODEL Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getModel
	 * ====
	 * Returns the Model corresponding to the given id
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getModel(id, cb) {
		modelModel.findById(id, {__v:0}).lean().exec(cb);
	}
	/**
	 * serviceGetModel
	 * ====
	 * Request Var:
	 * 		- id (string)		Model
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetModel(req, resp) {
		logger.info("<Service> GetModel.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.id, function(permOk) {
			if (permOk) {
				getModel(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify(obj)); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * getModelName
	 * ====
	 * Returns the Model's name
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getModelName(id, cb) {
		modelModel.findById(id).select('_id').lean().exec(cb);
	}
	/**
	 * serviceGetModelName
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetModelName(req, resp) {
		logger.info("<Service> GetModelName.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.id, function(permOk) {
			if (permOk) {
				getModelName(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ name: obj.name })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * getModelFile
	 * ====
	 * Returns the Model's file
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getModelFile(id, cb) {
		modelModel.findById(id).select('file').lean().exec(cb);
	}
	/**
	 * serviceGetModelFile
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetModelFile(req, resp) {
		logger.info("<Service> GetModelFile.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.id, function(permOk) {
			if (permOk) {
				getModelFile(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ file: obj.file })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * getModelCreator
	 * ====
	 * Returns the Model's creator (User)
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getModelCreator(id, cb) {
		modelModel.findById(modelId).populate('creator', '-__v -readModels -writeModels').exec(function(err, model) {
			if (!model) { return cb(null, 'Model doesn\'t exist'); }
			cb(err, model.creator);
		});
	}
	/**
	 * serviceGetModelCreator
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetModelCreator(req, resp) {
		logger.info("<Service> GetModelCreator.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.id, function(permOk) {
			if (permOk) {
				getModelCreator(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({creator: obj.creator })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * getModelCreationDate
	 * ====
	 * Returns the Model's creation date
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getModelCreationDate(id, cb) {
		modelModel.findById(id).select('creationDate').lean().exec(cb);
	}
	/**
	 * serviceGetModelCreationDate
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetModelCreationDate(req, resp) {
		logger.info("<Service> GetModelCreationDate.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.id, function(permOk) {
			if (permOk) {
				getModelCreationDate(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({creationDate: obj.creationDate})); 
				});
			} else {
				error(3, resp);
			}
		});
	}
 
	/**
	 * getModelThumbnail
	 * ====
	 * Returns the Model's creation date
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getModelThumbnail(id, cb) {
		modelModel.findById(id).select('thumbnail').lean().exec(cb);
	}
	/**
	 * serviceGetModelThumbnail
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetModelThumbnail(req, resp) {
		logger.info("<Service> GetModelThumbnail.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.id, function(permOk) {
			if (permOk) {
				getModelThumbnail(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({thumbnail: obj.thumbnail})); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * getModelTags
	 * ====
	 * Returns the Model's tags
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getModelTags(id, cb) {
		modelModel.findById(id).select('tags').lean().exec(cb);
	}
	/**
	 * serviceGetModelTags
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetModelTags(req, resp) {
		logger.info("<Service> GetModelTags.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.id, function(permOk) {
			if (permOk) {
				getModelTags(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({tags: obj.tags})); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * deleteModel
	 * ====
	 * Delete the Model corresponding to the given ID
	 * Parameters:
	 *	- id (String): 						ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function deleteModel(id, cb) {
		modelModel.findById(id).exec(function (err, item) {
			if (err){
				cb(err, null);
			}
              else {
					modelModel.remove(item, function (err, result) {
						cb(err, 'ok');
					});
              }
       });
	}
	/**
	 * serviceDeleteModel
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceDeleteModel(req, resp) {
		logger.info("<Service> DeleteModel.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.id, function(permOk) {
			if (permOk) {
				deleteModel(reqData.id, function (err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
		
	/**
	 * updateModel
	 * ====
	 * Update the Model corresponding to the given ID
	 * Parameters:
	 *	- id (String): 				ID
	 *	- name (String): 			Model name
	 *	- file (String): 			Filename
	 *  - creator (String):			ID of the Creator
	 *	- creationDate (Date): 		Date of creation
	 *  - thumbnail (String):		Filename of the thumbnail
	 *	- tags (String[]): 			Tags (optional)
	 *	- cb (Function(err, Model[])):	Callback
	 */ 
	function updateModel(id, name, file, creator, creationDate, thumbnail, tags, cb) {
		modelModel.findByIdAndUpdate(id, {name: name, file: file, creator: creator,  creationDate: creationDate,  thumbnail: thumbnail,  tags: tags}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
			if (err) { logger.error(err); return cb(err, raw); }
			else { return cb(err, 'ok'); }
		});	
	}
	/**
	 * serviceUpdateModel
	 * ====
	 * Request Var:
	 * 		- name (string)		Modelname
	 * Request Parameters:
	 *		- password (String): 	Password 	- required
	 *		- email (String): 		Email 		- required
	 */
	function serviceUpdateModel(req, resp) {
		logger.info("<Service> UpdateModel.");
		var reqData = parseRequest(req, ['id', 'name', 'file', 'creator', 'creationDate', 'thumbnail', 'tags']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.id, function(permOk) {
			if (permOk) {
				updateModel(reqData.id, reqData.name, reqData.file, reqData.creator, reqData.creationDate, reqData.thumbnail, reqData.tags, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	
	/**
	 * updateModelName
	 * ====
	 * Update the name of the Model corresponding to the given ID
	 * Parameters:
	 *	- id (String): 			ID
	 *	- name (String): 		Name to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateModelName(id, name, cb) {
			modelModel.findByIdAndUpdate(id, {name: name}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateModelName
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- name (String): 	Name 		- required
	 */
	function serviceUpdateModelName(req, resp) {
		logger.info("<Service> UpdateModelName.");
		var reqData = parseRequest(req, ['id', 'name']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.id, function(permOk) {
			if (permOk) {
				updateModelName(reqData.id, reqData.name, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
		
	/**
	 * updateModelFile
	 * ====
	 * Update the file of the Model corresponding to the given ID
	 * Parameters:
	 *	- id (String): 			ID
	 *	- file (String): 		File to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateModelFile(id, file, cb) {
			modelModel.findByIdAndUpdate(id, {file: file}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateModelFile
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- name (String): 	File 		- required
	 */
	function serviceUpdateModelFile(req, resp) {
		logger.info("<Service> UpdateModelFile.");
		var reqData = parseRequest(req, ['id', 'file']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.id, function(permOk) {
			if (permOk) {
				updateModelFile(reqData.id, reqData.file, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
		
	/**
	 * updateModelCreator
	 * ====
	 * Update the creator of the Model corresponding to the given ID
	 * Parameters:
	 *	- id (String): 			ID
	 *	- name (String): 		Creator to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateModelCreator(id, name, cb) {
			modelModel.findByIdAndUpdate(id, {creator: creator}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateModelCreator
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- name (String): 	Creator 		- required
	 */
	function serviceUpdateModelCreator(req, resp) {
		logger.info("<Service> UpdateModelCreator.");
		var reqData = parseRequest(req, ['id', 'creator']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.id, function(permOk) {
			if (permOk) {
				updateModelCreator(reqData.id, reqData.creator, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	
	/**
	 * updateModelCreationDate
	 * ====
	 * Update the creation date of the Model corresponding to the given ID
	 * Parameters:
	 *	- id (String): 			ID
	 *	- name (String): 		CreationDate to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateModelCreationDate(id, name, cb) {
			modelModel.findByIdAndUpdate(id, {creationDate: creationDate}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateModelCreationDate
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- name (String): 	CreationDate 		- required
	 */
	function serviceUpdateModelCreationDate(req, resp) {
		logger.info("<Service> UpdateModelCreationDate.");
		var reqData = parseRequest(req, ['id', 'creationDate']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.id, function(permOk) {
			if (permOk) {
				updateModelCreationDate(reqData.id, reqData.creationDate, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	
	/**
	 * updateModelThumbnail
	 * ====
	 * Update the thumbnail of the Model corresponding to the given ID
	 * Parameters:
	 *	- id (String): 			ID
	 *	- thumbnail (String): 		Thumbnail to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateModelThumbnail(id, thumbnail, cb) {
			modelModel.findByIdAndUpdate(id, {thumbnail: thumbnail}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateModelThumbnail
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- name (String): 	Thumbnail 		- required
	 */
	function serviceUpdateModelThumbnail(req, resp) {
		logger.info("<Service> UpdateModelThumbnail.");
		var reqData = parseRequest(req, ['id', 'thumbnail']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.id, function(permOk) {
			if (permOk) {
				updateModelThumbnail(reqData.id, reqData.thumbnail, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}	
	
	/**
	 * updateModelTags
	 * ====
	 * Update the tags of the Model corresponding to the given ID
	 * Parameters:
	 *	- id (String): 			ID
	 *	- name (String): 		Tags to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateModelTags(id, name, cb) {
			modelModel.findByIdAndUpdate(id, {tags: tags}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateModelTags
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- name (String): 	Tags 		- required
	 */
	function serviceUpdateModelTags(req, resp) {
		logger.info("<Service> UpdateModelTags.");
		var reqData = parseRequest(req, ['id', 'tags']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.id, function(permOk) {
			if (permOk) {
				updateModelTags(reqData.id, reqData.tags, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}


	/*
	 * ------------------------------------------
	 * USER + MODEL Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getUserModels
	 * ====
	 * Returns the models created by an User
	 * Parameters:
	 *	- userId (String): 				ID
	 *	- limit (int): 					Number max of Models to return
	 *	- offset (int): 				Number of the Model to start with
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getUserModels(userId, limit, offset, cb) {
		
		if (!offset) offset = 0;
		if (limit) {
			modelModel.find({creator: userId}, {__v:0}).sort({name: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelModel.find({creator: userId}, {__v:0}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * serviceGetUserModels
	 * ====
	 * Request Var:
	 * 		- userId (string)	User ID
	 * Request Parameters:
	 *	- limit (int): 			Number max of Models to return		- required
	 *	- offset (int): 		Number of the Model to start with	- required
	 */
	function serviceGetUserModels(req, resp) {
		logger.info("<Service> GetUserModels.");
		var reqData = parseRequest(req, ['userId', 'limit', 'offset']);
		
		writeHeaders(resp);
		hasPermissionUser(true, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				getUserModels(reqData.userId, reqData.limit, reqData.offset, function (err, objects) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({models: objects})); 
				});
			} else {
				error(3, resp);
			}
		});
	}


	/*
	 * ------------------------------------------
	 * RIGHTS Services
	 * ------------------------------------------
	 */
	 
	/**
	 * addRight
	 * ====
	 * Add a Right
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- id (String): 			ID of the user
	 *	- rightToWrite (bool): 		Flag: false = Read only, true = Read+Write	
	 *	- cb (Function(bool)):		Callback
	 */
	function addRight(modelId, id, rightToWrite, cb) {
		if (rightToWrite) {
			modelUser.findByIdAndUpdate(
				id,
				{$addToSet: { writeModels : modelId, readModels : modelId }},
				{ upsert: false, multi: false },
				function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					modelModel.findByIdAndUpdate(
						modelId,
						{$addToSet: { writers : id, readers : id }},
						{ upsert: false, multi: false },
						function (err, numberAffected, raw) {
							if (err) { logger.error(err); return cb(err, raw); }
							else { return cb(err, 'ok'); }
						});
				});	
		} else {
			modelUser.findByIdAndUpdate(
				id,
				{$addToSet: { readModels : modelId }},
				{ upsert: false, multi: false },
				function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					modelModel.findByIdAndUpdate(
						modelId,
						{$addToSet: { readers : id }},
						{ upsert: false, multi: false },
						function (err, numberAffected, raw) {
							if (err) { logger.error(err); return cb(err, raw); }
							else { return cb(err, 'ok'); }
						});	
				});	
			
		}
	}
	/**
	 * serviceAddRight
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- modelId (String): 		ID of the model				- required
	 *	- userId (String): 			ID of the user				- required
	 *	- rightToWrite (bool): 		Flag for the right to write	- required
	 */
	function serviceAddRight(req, resp) {
		logger.info("<Service> AddRight.");
		var reqData = parseRequest(req, ['modelId', 'userId', 'rightToWrite']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				addRight(reqData.modelId, reqData.userId, reqData.rightToWrite, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status }));
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * addCompleteRight
	 * ====
	 * Add a Right to Write & Read
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- id (String): 			ID of the user
	 *	- cb (Function(bool)):		Callback
	 */
	function addCompleteRight(modelId, id, cb) {
		modelUser.findByIdAndUpdate(
			id,
			{$addToSet: { writeModels : modelId, readModels : modelId }},
			{ upsert: false, multi: false },
			function (err, numberAffected, raw) {
				if (err) { logger.error(err); return cb(err, raw); }
				modelModel.findByIdAndUpdate(
					modelId,
					{$addToSet: { writers : id, readers : id }},
					{ upsert: false, multi: false },
					function (err, numberAffected, raw) {
						if (err) { logger.error(err); return cb(err, raw); }
						else { return cb(err, 'ok'); }
					});
			});	
	}
	/**
	 * serviceAddCompleteRight
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- modelId (String): 		ID of the model				- required
	 *	- userId (String): 			ID of the user				- required
	 *	- rightToWrite (bool): 		Flag for the right to write	- required
	 */
	function serviceAddCompleteRight(req, resp) {
		logger.info("<Service> AddCompleteRight.");
		var reqData = parseRequest(req, ['modelId', 'userId']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				addCompleteRight(reqData.modelId, reqData.userId, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status }));
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * addReadRight
	 * ====
	 * Add a Right to Read
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- id (String): 			ID of the user
	 *	- cb (Function(bool)):		Callback
	 */
	function addReadRight(modelId, id, cb) {
		modelUser.findByIdAndUpdate(
			id,
			{$addToSet: { readModels : modelId }},
			{ upsert: false, multi: false },
			function (err, numberAffected, raw) {
				if (err) { logger.error(err); return cb(err, raw); }
				modelModel.findByIdAndUpdate(
					modelId,
					{$addToSet: { readers : id }},
					{ upsert: false, multi: false },
					function (err, numberAffected, raw) {
						if (err) { logger.error(err); return cb(err, raw); }
						else { return cb(err, 'ok'); }
					});
			});	
	}
	/**
	 * serviceAddReadRight
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- modelId (String): 		ID of the model				- required
	 *	- userId (String): 			ID of the user				- required
	 *	- rightToWrite (bool): 		Flag for the right to write	- required
	 */
	function serviceAddReadRight(req, resp) {
		logger.info("<Service> AddReadRight.");
		var reqData = parseRequest(req, ['modelId', 'userId']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				addReadRight(reqData.modelId, reqData.userId, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status }));
				});
			} else {
				error(3, resp);
			}
		});
	}
		
	/**
	 * removeRight
	 * ====
	 * Remove a Right
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- id (String): 			ID of the user
	 *	- rightToWrite (bool): 		Flag: true = remove Write only, false = remove Write+Read
	 *	- cb (Function(bool)):		Callback
	 */
	function removeRight(modelId, id, rightToWrite, cb) {
		if (rightToWrite) {
			modelUser.findByIdAndUpdate(
				id,
				{$pull: { writeModels : modelId, readModels : modelId }},
				{ upsert: false, multi: false },
				function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					modelModel.findByIdAndUpdate(
						modelId,
						{$pull: { writers : id, readers : id }},
						{ upsert: false, multi: false },
						function (err, numberAffected, raw) {
							if (err) { logger.error(err); return cb(err, raw); }
							else { return cb(err, 'ok'); }
						});
				});	
		} else {
			modelUser.findByIdAndUpdate(
				id,
				{$pull: { writeModels : modelId }},
				{ upsert: false, multi: false },
				function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					modelModel.findByIdAndUpdate(
						modelId,
						{$pull: { writers : id }},
						{ upsert: false, multi: false },
						function (err, numberAffected, raw) {
							if (err) { logger.error(err); return cb(err, raw); }
							else { return cb(err, 'ok'); }
						});	
				});	
			
		}
	}
	/**
	 * serviceRemoveRight
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- modelId (String): 		ID of the model				- required
	 *	- userId (String): 			ID of the user				- required
	 */
	function serviceRemoveRight(req, resp, userId) {
		logger.info("<Service> RemoveRight.");
		var reqData = parseRequest(req, ['modelId', 'userId', 'rightToWrite']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				removeRight(reqData.modelId, reqData.userId, reqData.rightToWrite, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status }));
				});
			} else {
				error(3, resp);
			}
		});
	}
		
	/**
	 * removeCompleteRight
	 * ====
	 * Remove a Right to Write & Read
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- id (String): 			ID of the user
	 *	- cb (Function(bool)):		Callback
	 */
	function removeCompleteRight(modelId, id, cb) {
		modelUser.findByIdAndUpdate(
			id,
			{$pull: { writeModels : modelId, readModels : modelId }},
			{ upsert: false, multi: false },
			function (err, numberAffected, raw) {
				if (err) { logger.error(err); return cb(err, raw); }
				modelModel.findByIdAndUpdate(
					modelId,
					{$pull: { writers : id, readers : id }},
					{ upsert: false, multi: false },
					function (err, numberAffected, raw) {
						if (err) { logger.error(err); return cb(err, raw); }
						else { return cb(err, 'ok'); }
					});
			});	
	}
	/**
	 * serviceRemoveCompleteRight
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- modelId (String): 		ID of the model				- required
	 *	- userId (String): 			ID of the user				- required
	 */
	function serviceRemoveCompleteRight(req, resp) {
		logger.info("<Service> RemoveCompleteRight.");
		var reqData = parseRequest(req, ['modelId', 'userId']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				removeCompleteRight(reqData.modelId, reqData.userId, reqData.rightToWrite, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status }));
				});
			} else {
				error(3, resp);
			}
		});
	}
		
	/**
	 * removeWriteRight
	 * ====
	 * Remove a Right to Write & Read
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- id (String): 			ID of the user
	 *	- cb (Function(bool)):		Callback
	 */
	function removeWriteRight(modelId, id, cb) {
		modelUser.findByIdAndUpdate(
			id,
			{$pull: { writeModels : modelId }},
			{ upsert: false, multi: false },
			function (err, numberAffected, raw) {
				if (err) { logger.error(err); return cb(err, raw); }
				modelModel.findByIdAndUpdate(
					modelId,
					{$pull: { writers : id }},
					{ upsert: false, multi: false },
					function (err, numberAffected, raw) {
						if (err) { logger.error(err); return cb(err, raw); }
						else { return cb(err, 'ok'); }
					});
			});	
	}
	/**
	 * serviceRemoveWriteRight
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- modelId (String): 		ID of the model				- required
	 *	- userId (String): 			ID of the user				- required
	 */
	function serviceRemoveWriteRight(req, resp) {
		logger.info("<Service> RemoveWriteRight.");
		var reqData = parseRequest(req, ['modelId', 'userId']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				removeWriteRight(reqData.modelId, reqData.userId, reqData.rightToWrite, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status }));
				});
			} else {
				error(3, resp);
			}
		});
	}
		 	 
	/**
	 * getPersonallyReadableModels
	 * ====
	 * Returns a list of Model the User got the personal right to read
	 * Parameters:
	 * 	- userId (String):				ID of the User
	 *	- limit (int): 					Number max of Model to return
	 *	- offset (int): 				Number of the Model to start with
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getPersonallyReadableModels(userId, limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelUser.findOne(userId).populate('readModels', '-__v -writers -readers').sort({name: 1}).skip(offset).limit(limit).exec(function(err, user) {
				if (!user) { return cb(null, 'User doesn\'t exist'); }
				cb(err, user.readModels);
			});
		}
		else {
			modelUser.findOne(userId).populate('readModels', '-__v -writers -readers').sort({name: 1}).skip(offset).exec(function(err, user) {
				if (!user) { return cb(null, 'User doesn\'t exist'); }
				cb(err, user.readModels);
			});
		}
	}
	/**
	 * serviceGetPersonallyReadableModels
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- userId (String):	ID of the User						- required
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetPersonallyReadableModels(req, resp) {
		logger.info("<Service> GetPersonallyReadableModels.");
		var reqData = parseRequest(req, ['userId', 'limit', 'offset']);
		
		writeHeaders(resp);
		hasPermissionUser(true, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				getPersonallyReadableModels(reqData.userId, reqData.limit, reqData.offset, function (err, objects) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ readModels: objects })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
  
	/**
	 * getPersonallyEditableModels
	 * ====
	 * Returns a list of Model the User got the personal right to edit
	 * Parameters:
	 * 	- userId (String):				ID of the User
	 *	- limit (int): 					Number max of Model to return
	 *	- offset (int): 				Number of the Model to start with
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getPersonallyEditableModels(userId, limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelUser.findOne(userId).populate('writeModels', '-__v -writers -readers').sort({name: 1}).skip(offset).limit(limit).lean().exec(function(err, user) {
				if (!user) { return cb(null, 'User doesn\'t exist'); }
				cb(err, user.writeModels);
			});
		}
		else {
			modelUser.findOne(userId).populate('writeModels', '-__v -writers -readers').sort({name: 1}).skip(offset).lean().exec(function(err, user) {
				if (!user) { return cb(null, 'User doesn\'t exist'); }
				cb(err, user.writeModels);
			});
		}
	}
	/**
	 * serviceGetPersonallyEditableModels
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- userId (String):	ID of the User						- required
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetPersonallyEditableModels(req, resp) {
		logger.info("<Service> GetPersonallyEditableModels.");
		var reqData = parseRequest(req, ['userId', 'limit', 'offset']);
		
		writeHeaders(resp);
		hasPermissionUser(true, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				getPersonallyEditableModels(reqData.userId, reqData.limit, reqData.offset, function (err, objects) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ writeModels: objects })); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * getPubliclyReadableModels
	 * ====
	 * Returns a list of Model with public consultation
	 * Parameters:
	 *	- limit (int): 					Number max of Model to return
	 *	- offset (int): 				Number of the Model to start with
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getPubliclyReadableModels(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelModel.find({publicRead: true}, {__v: 0, writers: 0, readers: 0}).sort({name: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelModel.find({publicRead: true}, {__v: 0, writers: 0, readers: 0}).sort({name: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * serviceGetPubliclyReadableModels
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetPubliclyReadableModels(req, resp) {
		logger.info("<Service> GetPubliclyEditableModels.");
		var reqData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, null, function(permOk) {
			if (permOk) {
				getPubliclyReadableModels(reqData.limit, reqData.offset, function (err, objects) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ models: objects })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
 	   
	/**
	 * getPubliclyEditableModels
	 * ====
	 * Returns a list of Model with public edition
	 * Parameters:
	 *	- limit (int): 					Number max of Model to return
	 *	- offset (int): 				Number of the Model to start with
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getPubliclyEditableModels(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelModel.find({publicWrite: true}, {__v: 0, writers: 0, readers: 0}).sort({name: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelModel.find({publicWrite: true}, {__v: 0, writers: 0, readers: 0}).sort({name: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * serviceGetPubliclyEditableModels
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetPubliclyEditableModels(req, resp) {
		logger.info("<Service> GetPubliclyEditableModels.");
		var reqData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		hasPermissionUser(false, req.user, null, function(permOk) {
			if (permOk) {
				getPubliclyEditableModels(reqData.limit, reqData.offset, function (err, objects) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ models: objects })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
 	 	 	 	 
	/**
	 * getWriters
	 * ====
	 * Returns a list of User the Model can be edited by
	 * Parameters:
	 * 	- modelId (String):				ID of the Model
	 *	- limit (int): 					Number max of User to return
	 *	- offset (int): 				Number of the User to start with
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getWriters(modelId, limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelModel.findOne(modelId).populate('writers', '-__v -_id -readModels -writeModels').sort({name: 1}).skip(offset).limit(limit).exec(function(err, model) {
				if (!model) { return cb(null, 'Model doesn\'t exist'); }
				cb(err, model.writers);
			});
		}
		else {
			modelModel.findOne(modelId).populate('writers', '-__v -_id -readModels -writeModels').sort({name: 1}).skip(offset).lean().exec(function(err, model) {
				if (!model) { return cb(null, 'Model doesn\'t exist'); }
				cb(err, model.writers);
			});
		}
	}
	/**
	 * serviceGetWriters
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- modelId (String):	ID of the Model						- required
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetWriters(req, resp) {
		logger.info("<Service> GetWriters.");
		var reqData = parseRequest(req, ['modelId', 'limit', 'offset']);
		
		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				getWriters(reqData.modelId, reqData.limit, reqData.offset, function (err, objects) {
					logger.error(err);
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ writers: objects })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
 	 	 	 
	/**
	 * getReaders
	 * ====
	 * Returns a list of User the Model can be edited by
	 * Parameters:
	 * 	- modelId (String):				ID of the Model
	 *	- limit (int): 					Number max of User to return
	 *	- offset (int): 				Number of the User to start with
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getReaders(modelId, limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelModel.findOne(modelId).populate('readers', '-__v -_id -readModels -writeModels').sort({name: 1}).skip(offset).limit(limit).exec(function(err, model) {
				if (!model) { return cb(null, 'Model doesn\'t exist'); }
				cb(err, model.readers);
			});
		}
		else {
			modelModel.findOne(modelId).populate('readers', '-__v -_id -readModels -writeModels').sort({name: 1}).skip(offset).exec(function(err, model) {
				if (!model) { return cb(null, 'Model doesn\'t exist'); }
				cb(err, model.readers);
			});
		}
	}
	/**
	 * serviceGetReaders
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- modelId (String):	ID of the Model						- required
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetReaders(req, resp) {
		logger.info("<Service> GetReaders.");
		var reqData = parseRequest(req, ['modelId', 'limit', 'offset']);
		
		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				getReaders(reqData.modelId, reqData.limit, reqData.offset, function (err, objects) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ readers: objects })); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * getModelPublicRead
	 * ====
	 * Returns the Model's public read flag
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getModelPublicRead(id, cb) {
		modelModel.findById(id).select('publicRead').lean().exec(cb);
	}
	/**
	 * serviceGetModelPublicRead
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetModelPublicRead(req, resp) {
		logger.info("<Service> GetModelPublicRead.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				getModelPublicRead(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({publicRead: obj.publicRead})); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * getModelPublicWrite
	 * ====
	 * Returns the Model's public write flag
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getModelPublicWrite(id, cb) {
		modelModel.findById(id).select('publicWrite').lean().exec(cb);
	}
	/**
	 * serviceGetModelPublicWrite
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetModelPublicWrite(req, resp) {
		logger.info("<Service> GetModelPublicWrite.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				getModelPublicWrite(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({publicWrite: obj.publicWrite})); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * updateModelPublicRead
	 * ====
	 * Update the public read flag of the Model corresponding to the given ID
	 * Parameters:
	 *	- id (String): 					ID
	 *	- flag (bool): 					Flag Value
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateModelPublicRead(id, flag, cb) {
			modelModel.findByIdAndUpdate(id, {publicRead: flag}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateModelPublicRead
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- flag (bool): 		Flag Value		- required
	 */
	function serviceUpdateModelPublicRead(req, resp) {
		logger.info("<Service> UpdateModelPublicRead.");
		var reqData = parseRequest(req, ['id', 'publicRead']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				updateModelPublicRead(reqData.id, reqData.publicRead, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * updateModelPublicWrite
	 * ====
	 * Update the public write flag of the Model corresponding to the given ID
	 * Parameters:
	 *	- id (String): 					ID
	 *	- flag (bool): 					Flag Value
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateModelPublicWrite(id, flag, cb) {
			modelModel.findByIdAndUpdate(id, {publicWrite: flag}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateModelPublicWrite
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- flag (bool): 		Flag Value		- required
	 */
	function serviceUpdateModelPublicWrite(req, resp) {
		logger.info("<Service> UpdateModelPublicWrite.");
		var reqData = parseRequest(req, ['id', 'publicWrite']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				updateModelPublicWrite(reqData.id, reqData.publicWrite, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 	
	
	/*
	 * ------------------------------------------
	 * COMMENTS Services
	 * ------------------------------------------
	 */

	/**
	 * createComment
	 * ====
	 * Create a Comment.
	 * Parameters:
	 *	- modelId (String): 		Model the comment is associated with
	 *	- author (String): 			User ID of the author
	 *	- text (String): 			Content
	 *	- postedDate (Date): 		Date of creation
	 * 	- parentId (String)			ID of the parent comment (optional)
	 *	- cb (Function(bool)):		Callback
	 */
	function createComment(modelId, author, text, postedDate, parentId, cb) {
		if (!postedDate || typeof postedDate.toISOString != 'function') { postedDate = new Date(postedDate); }
		var slug = author+postedDate.toISOString();
		if (parentId) {
			modelComment.findById(parentId).exec(function(err, parentCom) {
				if (err) { error(2, resp); return; }
				if (!parentCom) { cb(null, 'Parent doesn\'t exist'); return; }
				slug = parentCom.slug + '/' + slug;
				var comment = new modelComment({modelId: modelId, author: author, text: text, postedDate: postedDate, parentId: parentId, slug: slug});
				comment.save(function(err) {
					cb (err, 'ok');
				});
			});
		} else {
			var comment = new modelComment({modelId: modelId, author: author, text: text, postedDate: postedDate, parentId: parentId, slug: slug});
			comment.save(function(err) {
				cb (err, 'ok');
			});
		}
	}
	/**
	 * serviceCreateComment
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- modelId (String): 		Model the comment is associated with	- required
	 *	- author (String): 			User ID of the author					- required
	 *	- text (String): 			Content									- required
	 *	- postedDate (Date): 		Date of creation						- optional
	 * 	- parentId (String)			ID of the parent comment (optional)		- optional
	 *	- cb (Function(bool)):		Callback								- required
	 */
	function serviceCreateComment(req, resp) {
		logger.info("<Service> CreateComment.");
		var reqData = parseRequest(req, ['modelId', 'author', 'text', 'postedDate', 'parentId']);
		
		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				createComment(reqData.modelId, reqData.author, reqData.text, reqData.postedDate, reqData.parentId, function(err, status) {
					if (err) { logger.error(err); error(2, resp); }
					else resp.end(JSON.stringify({ status: status }));
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * getComments
	 * ====
	 * Returns a list of comments, ordered by date.
	 * Parameters:
	 *	- limit (int): 					Number max of users to return
	 *	- offset (int): 				Number of the comment to start with
	 *	- cb (Function(err, Comment[])):	Callback
	 */
	function getComments(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelComment.find({}, {__v:0}).sort({postedDate: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelComment.find({}, {__v:0}).sort({postedDate: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * serviceGetComments
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the comment to start with	- optional
	 */
	function serviceGetComments(req, resp) {
		logger.info("<Service> GetComments.");
		var reqData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		hasPermissionUser(true, req.user, null, function(permOk) {
			if (permOk) {
				getComments(reqData.limit, reqData.offset, function (err, users) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ comments: users })); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/*
	 * ------------------------------------------
	 * COMMENT Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getComment
	 * ====
	 * Returns the Comment corresponding to the given id
	 * Parameters:
	 *	- id (String): 						ID
	 *	- cb (Function(err, Comment[])):	Callback
	 */
	function getComment(id, cb) {
		modelComment.findById(id, {__v:0}).lean().exec(cb);
	}
	/**
	 * serviceGetComment
	 * ====
	 * Request Var:
	 * 		- id (string)		id
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetComment(req, resp) {
		logger.info("<Service> GetComment.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionComment(false, req.user, reqData.id, null, function(permOk) {
			if (permOk) {
				getComment(reqData.id, function (err, comment) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify(comment)); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * getCommentModelId
	 * ====
	 * Returns the Comment's modelId
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Comment[])):	Callback
	 */
	function getCommentModelId(id, cb) {
		modelComment.findById(id).select('modelId').lean().exec(cb);
	}
	/**
	 * serviceGetCommentModelId
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetCommentModelId(req, resp) {
		logger.info("<Service> GetCommentModelId.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionComment(false, req.user, reqData.id, null, function(permOk) {
			if (permOk) {
				getCommentModelId(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ modelId: obj.modelId })); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * getCommentAuthor
	 * ====
	 * Returns the Comment's author
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Comment[])):	Callback
	 */
	function getCommentAuthor(id, cb) {
		modelComment.findById(id).select('author').lean().exec(cb);
	}
	/**
	 * serviceGetCommentAuthor
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetCommentAuthor(req, resp) {
		logger.info("<Service> GetCommentAuthor.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionComment(false, req.user, reqData.id, null, function(permOk) {
			if (permOk) {
				getCommentAuthor(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ author: obj.author })); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * getCommentParentId
	 * ====
	 * Returns the Comment's parentId
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Comment[])):	Callback
	 */
	function getCommentParentId(id, cb) {
		modelComment.findById(id).select('parentId').lean().exec(cb);
	}
	/**
	 * serviceGetCommentParentId
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetCommentParentId(req, resp) {
		logger.info("<Service> GetCommentParentId.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionComment(false, req.user, reqData.id, null, function(permOk) {
			if (permOk) {
				getCommentParentId(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ parentId: obj.parentId })); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * getCommentSlug
	 * ====
	 * Returns the Comment's slug
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Comment[])):	Callback
	 */
	function getCommentSlug(id, cb) {
		modelComment.findById(id).select('slug').lean().exec(cb);
	}
	/**
	 * serviceGetCommentSlug
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetCommentSlug(req, resp) {
		logger.info("<Service> GetCommentSlug.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionComment(false, req.user, reqData.id, null, function(permOk) {
			if (permOk) {
				getCommentSlug(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ slug: obj.slug })); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * getCommentPostedDate
	 * ====
	 * Returns the Comment's postedDate
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Comment[])):	Callback
	 */
	function getCommentPostedDate(id, cb) {
		modelComment.findById(id).select('postedDate').lean().exec(cb);
	}
	/**
	 * serviceGetCommentPostedDate
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetCommentPostedDate(req, resp) {
		logger.info("<Service> GetCommentPostedDate.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionComment(false, req.user, reqData.id, null, function(permOk) {
			if (permOk) {
				getCommentPostedDate(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ postedDate: obj.postedDate })); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * getCommentText
	 * ====
	 * Returns the Comment's text
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Comment[])):	Callback
	 */
	function getCommentText(id, cb) {
		modelComment.findById(id).select('text').lean().exec(cb);
	}
	/**
	 * serviceGetCommentText
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetCommentText(req, resp) {
		logger.info("<Service> GetCommentText.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionComment(false, req.user, reqData.id, null, function(permOk) {
			if (permOk) {
				getCommentText(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ text: obj.text })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
		
	/**
	 * updateCommentText
	 * ====
	 * Update the text of the Comment corresponding to the given ID
	 * Parameters:
	 *	- id (String): 			ID
	 *	- name (String): 		Text to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateCommentText(id, name, cb) {
			modelComment.findByIdAndUpdate(id, {text: text}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateCommentText
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- name (String): 	Text 		- required
	 */
	function serviceUpdateCommentText(req, resp) {
		logger.info("<Service> UpdateCommentText.");
		var reqData = parseRequest(req, ['id', 'text']);
		
		writeHeaders(resp);
		hasPermissionComment(true, req.user, reqData.id, null, function(permOk) {
			if (permOk) {
				updateCommentText(reqData.id, reqData.text, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * deleteComment
	 * ====
	 * Delete the Comment corresponding to the given ID
	 * Parameters:
	 *	- id (String): 						ID
	 *	- cb (Function(err, Comment[])):	Callback
	 */
	function deleteComment(id, cb) {
		modelComment.findById(id).exec(function (err, item) {
			if (err){
				cb(err, null);
			}
              else {
					modelComment.remove(item, function (err, result) {
						cb(err, result);
					});
              }
       });
	}
	/**
	 * serviceDeleteComment
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceDeleteComment(req, resp) {
		logger.info("<Service> DeleteComment.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionComment(true, req.user, reqData.id, null, function(permOk) {
			if (permOk) {
				deleteComment(reqData.id, function (err, user) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}


	/*
	 * ------------------------------------------
	 * USER + COMMENT Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getUserComments
	 * ====
	 * Returns the Comments created by an User
	 * Parameters:
	 *	- userId (String): 				ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getUserComments(userId, cb) {
		modelComment.find({author: userId}, {__v:0}).lean().exec(cb);
	}
	/**
	 * serviceGetUserComments
	 * ====
	 * Request Var:
	 * 		- name (string)		name
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetUserComments(req, resp) {
		logger.info("<Service> GetUserComments.");
		var reqData = parseRequest(req, ['userId']);
		
		writeHeaders(resp);
		hasPermissionUser(true, req.user, reqData.userId, function(permOk) {
			if (permOk) {
				getUserComments(reqData.userId, function (err, objects) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({comments: objects})); 
				});
			} else {
				error(3, resp);
			}
		});
	}


	/*
	 * ------------------------------------------
	 * MODEL + COMMENT Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getModelComments
	 * ====
	 * Returns the Comments created for an Model
	 * Parameters:
	 *	- modelId (String): 			Model's ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getModelComments(modelId, limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelComment.find({modelId: modelId}, {__v:0}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelComment.find({modelId: modelId}, {__v:0}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * serviceGetModelComments
	 * ====
	 * Request Var:
	 * 		- modelId (string)		modelId
	 * Request Parameters:
	 *		-none
	 *	- limit (int): 					Number max of comments to return
	 *	- offset (int): 				Number of the comments to start with
	 */
	function serviceGetModelComments(req, resp) {
		logger.info("<Service> GetModelComments.");
		var reqData = parseRequest(req, ['modelId','limit', 'offset']);

		writeHeaders(resp);
		hasPermissionModel(false, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				getModelComments(reqData.modelId, reqData.limit, reqData.offset, function (err, objects) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({comments: objects})); 
				});
			} else {
				error(3, resp);
			}
		});
	}
		
	
	/*
	 * ------------------------------------------
	 * FILES Services
	 * ------------------------------------------
	 */

	/**
	 * createFile
	 * ====
	 * Create a File.
	 * Parameters:
	 *	- content (String): 		Content of the File
	 *	- modelId (String): 		ID of the model this file is for
	 *	- cb (Function(bool)):		Callback
	 */
	function createFile(content, modelId, cb) {
		var file = new modelFile({content: content, modelId: modelId});
		file.save(function(err) {
			cb (err, file.id);
		});
	}
	/**
	 * serviceCreateFile
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- content (String): 		Content								- required
	 *	- modelId (String): 		ID of the model this file is for	- required
	 */
	function serviceCreateFile(req, resp) {
		logger.info("<Service> CreateFile.");
		var reqData = parseRequest(req, ['content', 'modelId']);
		
		writeHeaders(resp);
		hasPermissionModel(true, req.user, reqData.modelId, function(permOk) {
			if (permOk) {
				createFile(reqData.content, reqData.modelId, function(err, id) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: 'ok', id: id }));
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * getFiles
	 * ====
	 * Returns a list of Files.
	 * Parameters:
	 *	- limit (int): 					Number max of files to return
	 *	- offset (int): 				Number of the file to start with
	 *	- cb (Function(err, File[])):	Callback
	 */
	function getFiles(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelFile.find({}, {__v:0}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelFile.find({}, {__v:0}).skip(offset).lean().exec(cb);
		}
	}
	
	/**
	 * serviceGetFiles
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the comment to start with	- optional
	 */
	function serviceGetFiles(req, resp) {
		logger.info("<Service> GetFiles.");
		var reqData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		hasPermissionUser(true, req.user, null, function(permOk) {
			if (permOk) {
				getFiles(reqData.limit, reqData.offset, function (err, files) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ files: files })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
 	
 	
 	/*
	 * ------------------------------------------
	 * FILE Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getFile
	 * ====
	 * Returns the File corresponding to the given id
	 * Parameters:
	 *	- id (String): 						ID
	 *	- cb (Function(err, File[])):	Callback
	 */
	function getFile(id, cb) {
		modelFile.findById(id, {__v:0}).lean().exec(cb);
	}
	/**
	 * serviceGetFile
	 * ====
	 * Request Var:
	 * 		- id (string)		id
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetFile(req, resp) {
		logger.info("<Service> GetFile.");
		var reqData = parseRequest(req, ['id', 'modelId']);
		
		writeHeaders(resp);
		hasPermissionFile(false, req.user, reqData.id, reqData.modelId , function(permOk) {
			if (permOk) {
				getFile(reqData.id, function (err, comment) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify(comment)); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * getFileContent
	 * ====
	 * Returns the File's content
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, File[])):	Callback
	 */
	function getFileContent(id, cb) {
		modelFile.findById(id).select('content').lean().exec(cb);
	}
	/**
	 * serviceGetFileContent
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetFileContent(req, resp) {
		logger.info("<Service> GetFileContent.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionFile(false, req.user, reqData.id, null, function(permOk) {
			if (permOk) {
				getFileContent(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ content: obj.content })); 
				});
			} else {
				error(3, resp);
			}
		});
	}

	/**
	 * getFileModelId
	 * ====
	 * Returns the File's modelId
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, File[])):	Callback
	 */
	function getFileModelId(id, cb) {
		modelFile.findById(id).select('modelId').lean().exec(cb);
	}
	/**
	 * serviceGetFileModelId
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetFileModelId(req, resp) {
		logger.info("<Service> GetFileModelId.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionFile(false, req.user, reqData.id, null, function(permOk) {
			if (permOk) {
				getFileModelId(reqData.id, function (err, obj) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ modelId: obj.modelId })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
			
	/**
	 * updateFileContent
	 * ====
	 * Update the content of the File corresponding to the given ID
	 * Parameters:
	 *	- id (String): 					ID
	 *	- content (String): 			Content to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateFileContent(id, content, cb) {
			modelFile.findByIdAndUpdate(id, {content: content}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 'ok'); }
			});
	}
	/**
	 * serviceUpdateFileContent
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- name (String): 	Content 		- required
	 */
	function serviceUpdateFileContent(req, resp) {
		logger.info("<Service> UpdateFileContent.");
		var reqData = parseRequest(req, ['id', 'content', 'modelId']);
		
		writeHeaders(resp);
		hasPermissionFile(true, req.user, reqData.id, reqData.modelId, function(permOk) {
			if (permOk) {
				updateFileContent(reqData.id, reqData.content, function(err, status) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
		});
	}
	 
	/**
	 * deleteFile
	 * ====
	 * Delete the File corresponding to the given ID
	 * Parameters:
	 *	- id (String): 						ID
	 *	- cb (Function(err, File[])):	Callback
	 */
	function deleteFile(id, cb) {
		modelFile.findById(id).exec(function (err, item) {
			if (err){
				cb(err, null);
			}
              else {
					modelFile.remove(item, function (err, result) {
						cb(err, result);
					});
              }
       });
	}
	/**
	 * serviceDeleteFile
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceDeleteFile(req, resp) {
		logger.info("<Service> DeleteFile.");
		var reqData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		hasPermissionFile(true, req.user, reqData.id, null, function(permOk) {
			if (permOk) {
				deleteFile(reqData.id, function (err, user) {
					if (err) error(2, resp);
					else resp.end(JSON.stringify({ status: status })); 
				});
			} else {
				error(3, resp);
			}
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
	this.rest['user/:userId'] = {
		'GET'	: serviceGetUser,
		'DELETE': serviceDeleteUser,
		'PUT'	: serviceUpdateUser
	};
	this.rest['user/:userId/username'] = {
		'GET'	: serviceGetUserUsername,
		'PUT'	: serviceUpdateUserUsername
	};
	this.rest['user/:userId/email'] = {
		'GET'	: serviceGetUserEmail,
		'PUT'	: serviceUpdateUserEmail
	};
	this.rest['user/:userId/password'] = {
		'PUT'	: serviceUpdateUserPassword
	};
	this.rest['user/:userId/openId'] = {
		'GET'	: serviceGetUserOpenId,
		'PUT'	: serviceUpdateUserOpenId
	};
	this.rest['user/:userId/facebookId'] = {
		'GET'	: serviceGetUserFacebookId,
		'PUT'	: serviceUpdateUserFacebookId
	};
	this.rest['user/:userId/googleId'] = {
		'GET'	: serviceGetUserGoogleId,
		'PUT'	: serviceUpdateUserGoogleId
	};
	this.rest['user/:userId/token'] = {
		'GET'	: serviceGetUserToken
	};
	
	
	this.rest['models'] = {
		'POST'	: serviceCreateModel,
		'GET'	: serviceGetModels
	};
	this.rest['model/:id'] = {
		'GET'	: serviceGetModel,
		'DELETE': serviceDeleteModel,
		'PUT'	: serviceUpdateModel
	};
	this.rest['model/:id/name'] = {
		'GET'	: serviceGetModelName,
		'PUT'	: serviceUpdateModelName
	};
	this.rest['model/:id/file'] = {
		'GET'	: serviceGetModelFile,
		'PUT'	: serviceUpdateModelFile
	};
	this.rest['model/:id/creator'] = {
		'GET'	: serviceGetModelCreator,
		'PUT'	: serviceUpdateModelCreator
	};
	this.rest['model/:id/creationdate'] = {
		'GET'	: serviceGetModelCreationDate,
		'PUT'	: serviceUpdateModelCreationDate
	};
	this.rest['model/:id/thumbnail'] = {
		'GET'	: serviceGetModelThumbnail,
		'PUT'	: serviceUpdateModelThumbnail
	};
	this.rest['model/:id/tags'] = {
		'GET'	: serviceGetModelTags,
		'PUT'	: serviceUpdateModelTags
	};

	this.rest['model/:id/publicRead'] = {
		'GET'	: serviceGetModelPublicRead,
		'PUT'	: serviceUpdateModelPublicRead
	};
	this.rest['model/:id/publicWrite'] = {
		'GET'	: serviceGetModelPublicWrite,
		'PUT'	: serviceUpdateModelPublicWrite
	};

	this.rest['models/publicRead'] = {
		'GET'	: serviceGetPubliclyReadableModels
	};
	this.rest['models/publicWrite'] = {
		'GET'	: serviceGetPubliclyEditableModels
	};
		
	this.rest['model/:modelId/writers'] = {
		'GET'	: serviceGetWriters,
		'POST'	: serviceAddCompleteRight
	};
	this.rest['model/:modelId/readers'] = {
		'GET'	: serviceGetReaders,
		'POST'	: serviceAddReadRight
	};
	this.rest['user/:userId/writeModels'] = {
		'GET'	: serviceGetPersonallyEditableModels,
		'POST'	: serviceAddCompleteRight
	};
	this.rest['user/:userId/readModels'] = {
		'GET'	: serviceGetPersonallyReadableModels,
		'POST'	: serviceAddReadRight
	};

	this.rest['user/:userId/writeModel/:modelId'] = {
		'DELETE': serviceRemoveWriteRight
	};
	this.rest['user/:userId/readModel/:modelId'] = {
		'DELETE': serviceRemoveCompleteRight
	};
	this.rest['model/:modelId/writer/:userId'] = {
		'DELETE': serviceRemoveWriteRight
	};
	this.rest['model/:modelId/reader/:userId'] = {
		'DELETE': serviceRemoveCompleteRight
	};

	this.rest['user/:userId/models'] = {
		'GET'	: serviceGetUserModels
	};
	
	this.rest['comments'] = {
		'POST'	: serviceCreateComment,
		'GET'	: serviceGetComments
	};
	this.rest['comment/:id'] = {
		'GET'	: serviceGetComment,
		'DELETE': serviceDeleteComment,
	};
	this.rest['comment/:id/modelId'] = {
		'GET'	: serviceGetCommentModelId
	};
	this.rest['comment/:id/author'] = {
		'GET'	: serviceGetCommentAuthor
	};
	this.rest['comment/:id/text'] = {
		'GET'	: serviceGetCommentText,
		'PUT'	: serviceUpdateCommentText
	};
	this.rest['comment/:id/slug'] = {
		'GET'	: serviceGetCommentSlug
	};
	this.rest['comment/:id/postedDate'] = {
		'GET'	: serviceGetCommentPostedDate
	};
	this.rest['comment/:id/parentId'] = {
		'GET'	: serviceGetCommentParentId
	};

	this.rest['user/:userId/comments'] = {
		'GET'	: serviceGetUserComments
	};
	this.rest['model/:modelId/comments'] = {
		'GET'	: serviceGetModelComments
	};
	
	this.rest['files'] = {
		'POST'	: serviceCreateFile,
		'GET'	: serviceGetFiles
	};
	this.rest['file/:id'] = {
		'GET'	: serviceGetFile,
		'DELETE': serviceDeleteFile
	};
	this.rest['file/:id/content'] = {
		'GET'	: serviceGetFileContent,
		'PUT'	: serviceUpdateFileContent
	};
	this.rest['file/:id/modelId'] = {
		'GET'	: serviceGetFileModelId
	};

	/*
	 * ------------------------------------------
	 * LOCAL MODULE METHODS
	 * ------------------------------------------
	 */
	 
	/*this.local = {};
	this.local.createUser = createUser;
	this.local.getUsers = getUsers;
	this.local.getUser = getUser;
	*/
	
	return this;
};
