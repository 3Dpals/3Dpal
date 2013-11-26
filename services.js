/**
 * =================
 * MODULE - Services
 * =================
 * REST and local services
 */

var	logger = require("./logger");
var	bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10;

module.exports = function(mongoose, modelUser, modelModel, modelRight) {

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
			else resp.end(JSON.stringify(user)); 
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
		modelUser.findOne({name: name}).exec(function (err, item) {
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
	 * MODELS Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createModel
	 * ====
	 * Create a Model (only if her/his name is unique).
	 * Parameters:
	 *	- name (String): 			Model name
	 *	- file (String): 			Filename
	 *  - creator (String):			Username of the Creator
	 *	- creationDate (Date): 		Date of creation
	 *  - thumbnail (String):		Filename of the thumbnail
	 *	- tags (String[]): 			Tags (optional)
	 *	- cb (Function(bool)):		Callback
	 */
	function createModel(name, file, creator, creationDate, thumbnail, tags, cb) {
		var obj = new modelModel({name: name, file: file, creator: creator,  creationDate: creationDate,  thumbnail: thumbnail,  tags: tags});
		obj.save(function(err) {
			logger.debug(err);
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
	 *  - creator (String):			Username of the Creator		- required
	 *	- creationDate (Date): 		Date of creation			- required
	 *  - thumbnail (String):		Filename of the thumbnail	- required
	 *	- tags (String[]): 			Tags (optional)				- optional
	 */
	function serviceCreateModel(req, resp) {
		logger.info("<Service> CreateModel.");
		var objectsData = parseRequest(req, ['name', 'file', 'creator', 'creationDate', 'thumbnail', 'tags']);
		
		writeHeaders(resp);
		createModel(objectsData.name, objectsData.file, objectsData.creator, objectsData.creationDate, objectsData.thumbnail, objectsData.tags, function(err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 }));
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
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getModels(getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ objects: objects })); 
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
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModel(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify(obj)); 
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
		modelModel.findById(id, {__v:0, _id:0, file:0, creator:0, creationDate:0, thumbnail:0, tags:0}).lean().exec(cb);
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
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelName(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ name: obj.name })); 
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
		modelModel.findById(id, {__v:0, _id:0, name:0, creator:0, creationDate:0, thumbnail:0, tags:0}).lean().exec(cb);
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
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelFile(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ file: obj.file })); 
		});
	}
	 
	/**
	 * getModelCreator
	 * ====
	 * Returns the Model's file
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getModelCreator(id, cb) {
		modelModel.findById(id, {__v:0, _id:0, file:0, creator:0, creationDate:0, thumbnail:0, tags:0}).lean().exec(cb);
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
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelCreator(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({creator: obj.creator })); 
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
		modelModel.findById(id, {__v:0, _id:0, file:0, creator:0, name:0, thumbnail:0, tags:0}).lean().exec(cb);
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
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelCreationDate(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({creationDate: obj.creationDate})); 
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
		modelModel.findById(id, {__v:0, _id:0, file:0, creator:0, name:0, creationDate:0, tags:0}).lean().exec(cb);
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
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelThumbnail(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({thumbnail: obj.thumbnail})); 
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
		modelModel.findById(id, {__v:0, _id:0, file:0, creator:0, name:0, creationDate:0, thumbnail:0}).lean().exec(cb);
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
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelTags(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({tags: obj.tags})); 
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
						cb(err, result);
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
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		deleteModel(getData.id, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
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
	 *  - creator (String):			Username of the Creator
	 *	- creationDate (Date): 		Date of creation
	 *  - thumbnail (String):		Filename of the thumbnail
	 *	- tags (String[]): 			Tags (optional)
	 *	- cb (Function(err, Model[])):	Callback
	 */ 
	function updateModel(id, name, file, creator, creationDate, thumbnail, tags, cb) {
		modelModel.update({ _id: id }, {name: name, file: file, creator: creator,  creationDate: creationDate,  thumbnail: thumbnail,  tags: tags}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
			if (err) { logger.error(err); return cb(err, raw); }
			else { return cb(err, 1); }
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
		var objectsData = parseRequest(req, ['id', 'name', 'file', 'creator', 'creationDate', 'thumbnail', 'tags']);
		
		writeHeaders(resp);
		updateModel(objectsData.id, objectsData.name, objectsData.file, objectsData.creator, objectsData.creationDate, objectsData.thumbnail, objectsData.tags, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
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
			modelModel.update({ _id: id }, {name: name}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
			});
	}
	/**
	 * serviceUpdateModelName
	 * ====
	 * Request Var:
	 * 		- id (string)		Username
	 * Request Parameters:
	 *		- name (String): 	Name 		- required
	 */
	function serviceUpdateModelName(req, resp) {
		logger.info("<Service> UpdateModelName.");
		var objData = parseRequest(req, ['id', 'name']);
		
		writeHeaders(resp);
		updateModelName(objData.id, objData.name, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
		});
	}
		
	/**
	 * updateModelFile
	 * ====
	 * Update the file of the Model corresponding to the given ID
	 * Parameters:
	 *	- id (String): 			ID
	 *	- name (String): 		File to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateModelFile(id, name, cb) {
			modelModel.update({ _id: id }, {file: file}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
			});
	}
	/**
	 * serviceUpdateModelFile
	 * ====
	 * Request Var:
	 * 		- id (string)		Username
	 * Request Parameters:
	 *		- name (String): 	File 		- required
	 */
	function serviceUpdateModelFile(req, resp) {
		logger.info("<Service> UpdateModelFile.");
		var objData = parseRequest(req, ['id', 'file']);
		
		writeHeaders(resp);
		updateModelFile(objData.id, objData.file, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
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
			modelModel.update({ _id: id }, {creator: creator}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
			});
	}
	/**
	 * serviceUpdateModelCreator
	 * ====
	 * Request Var:
	 * 		- id (string)		Username
	 * Request Parameters:
	 *		- name (String): 	Creator 		- required
	 */
	function serviceUpdateModelCreator(req, resp) {
		logger.info("<Service> UpdateModelCreator.");
		var objData = parseRequest(req, ['id', 'creator']);
		
		writeHeaders(resp);
		updateModelCreator(objData.id, objData.creator, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
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
			modelModel.update({ _id: id }, {creationDate: creationDate}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
			});
	}
	/**
	 * serviceUpdateModelCreationDate
	 * ====
	 * Request Var:
	 * 		- id (string)		Username
	 * Request Parameters:
	 *		- name (String): 	CreationDate 		- required
	 */
	function serviceUpdateModelCreationDate(req, resp) {
		logger.info("<Service> UpdateModelCreationDate.");
		var objData = parseRequest(req, ['id', 'creationDate']);
		
		writeHeaders(resp);
		updateModelCreationDate(objData.id, objData.creationDate, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
		});
	}
	
	/**
	 * updateModelThumbnail
	 * ====
	 * Update the thumbnail of the Model corresponding to the given ID
	 * Parameters:
	 *	- id (String): 			ID
	 *	- name (String): 		Thumbnail to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateModelThumbnail(id, name, cb) {
			modelModel.update({ _id: id }, {thumbnail: thumbnail}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
			});
	}
	/**
	 * serviceUpdateModelThumbnail
	 * ====
	 * Request Var:
	 * 		- id (string)		Username
	 * Request Parameters:
	 *		- name (String): 	Thumbnail 		- required
	 */
	function serviceUpdateModelThumbnail(req, resp) {
		logger.info("<Service> UpdateModelThumbnail.");
		var objData = parseRequest(req, ['id', 'thumbnail']);
		
		writeHeaders(resp);
		updateModelThumbnail(objData.id, objData.thumbnail, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
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
			modelModel.update({ _id: id }, {tags: tags}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
			});
	}
	/**
	 * serviceUpdateModelTags
	 * ====
	 * Request Var:
	 * 		- id (string)		Username
	 * Request Parameters:
	 *		- name (String): 	Tags 		- required
	 */
	function serviceUpdateModelTags(req, resp) {
		logger.info("<Service> UpdateModelTags.");
		var objData = parseRequest(req, ['id', 'tags']);
		
		writeHeaders(resp);
		updateModelTags(objData.id, objData.tags, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
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
	 *	- name (String): 				Username
	 *	- cb (Function(err, Model[])):	Callback
	 */
	function getUserModels(name, cb) {
		modelModel.find({creator: name}, {__v:0}).lean().exec(cb);
	}
	/**
	 * serviceGetUserModels
	 * ====
	 * Request Var:
	 * 		- name (string)		name
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetUserModels(req, resp) {
		logger.info("<Service> GetUserModels.");
		var getData = parseRequest(req, ['name']);
		
		writeHeaders(resp);
		getUserModels(getData.name, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({models: objects})); 
		});
	}


	/*
	 * ------------------------------------------
	 * RIGHTS Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createRight
	 * ====
	 * Create a Right (only if her/his name is unique).
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- userId (String): 			ID of the user
	 *	- rightToWrite (bool): 		Flag: false = Read only, true = Read+Write	
	 *	- cb (Function(bool)):		Callback
	 */
	function createRight(modelId, userId, rightToWrite, cb) {
		if (rightToRead &!rightToWrite) { cb ('No rights given', null); return; }
		var obj = new modelRight({modelId: modelId, userId: userId, rightLevel: rightToWrite});
		obj.save(function(err) {
			logger.debug(err);
			cb (err, obj);
		});
	}
	/**
	 * serviceCreateRight
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *	- modelId (String): 		ID of the model				- required
	 *	- userId (String): 			ID of the user				- required
	 *	- rightToWrite (bool): 		Flag for the right to write	- required
	 */
	function serviceCreateRight(req, resp) {
		logger.info("<Service> CreateRight.");
		var objectsData = parseRequest(req, ['modelId', 'userId', 'rightToWrite']);
		
		writeHeaders(resp);
		createRight(objectsData.modelId, objectsData.userId, objectsData.rightToWrite, function(err, right) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 }));
		});
	}
	 
	/**
	 * getRights
	 * ====
	 * Returns a list of rights, ordered by name.
	 * Parameters:
	 *	- limit (int): 					Number max of Right to return
	 *	- offset (int): 				Number of the Right to start with
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getRights(limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelRight.find({}, {__v:0}).sort({name: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelRight.find({}, {__v:0}).sort({name: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * serviceGetRights
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetRights(req, resp) {
		logger.info("<Service> GetRights.");
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getRights(getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ objects: objects })); 
		});
	}
	 
	/**
	 * getRightsPerUser
	 * ====
	 * Returns a list of rights for a given User, ordered by name.
	 * Parameters:
	 * 	- userId (String):				ID of the User
	 *	- limit (int): 					Number max of Right to return
	 *	- offset (int): 				Number of the Right to start with
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getRightsPerUser(userId, limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelRight.find({userId: userId}, {__v:0}).sort({name: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelRight.find({}, {__v:0}).sort({name: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * serviceGetRightsPerUser
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- userId (String):	ID of the User						- required
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetRightsPerUser(req, resp) {
		logger.info("<Service> GetRightsPerUser.");
		var getData = parseRequest(req, ['userId', 'limit', 'offset']);
		
		writeHeaders(resp);
		getRightsPerUser(getData.userId, getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ objects: objects })); 
		});
	}
 
	/**
	 * getRightsPerModel
	 * ====
	 * Returns a list of rights for a given Model, ordered by name.
	 * Parameters:
	 * 	- modelId (String):				ID of the Model
	 *	- limit (int): 					Number max of Right to return
	 *	- offset (int): 				Number of the Right to start with
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getRightsPerModel(modelId, limit, offset, cb) {
		if (!offset) offset = 0;
		if (limit) {
			modelRight.find({modelId: modelId}, {__v:0}).sort({name: 1}).skip(offset).limit(limit).lean().exec(cb);
		}
		else {
			modelRight.find({}, {__v:0}).sort({name: 1}).skip(offset).lean().exec(cb);
		}
	}
	/**
	 * serviceGetRightsPerModel
	 * ====
	 * Request Var:
	 * 		none
	 * Request Parameters:
	 * 		- modelId (String):	ID of the Model						- required
	 *		- limit (int): 		Number max to return				- optional
	 *		- offset (int): 	Number of the Right to start with	- optional
	 */
	function serviceGetRightsPerModel(req, resp) {
		logger.info("<Service> GetRightsPerModel.");
		var getData = parseRequest(req, ['modelId', 'limit', 'offset']);
		
		writeHeaders(resp);
		getRightsPerModel(getData.modelId, getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ objects: objects })); 
		});
	}

	/*
	 * ------------------------------------------
	 * RIGHT Services
	 * ------------------------------------------
	 */
	 
	/**
	 * getRight
	 * ====
	 * Returns the Right corresponding to the given id
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getRight(id, cb) {
		modelRight.findById(id, {__v:0}).lean().exec(cb);
	}
	/**
	 * serviceGetRight
	 * ====
	 * Request Var:
	 * 		- id (string)		Right
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetRight(req, resp) {
		logger.info("<Service> GetRight.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getRight(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify(obj)); 
		});
	}
	 	 
	/**
	 * getRightWithModelAndUser
	 * ====
	 * Returns the Right corresponding to the given Model and User
	 * Parameters:
	 *	- modelId (String): 			ID of the Model
	 *	- userId (String): 				ID of the User
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getRightWithModelAndUser(modelId, userId, cb) {
		modelRight.findOne({modelId: modelId, userId:userId}, {__v:0}).lean().exec(cb);
	}
	/**
	 * serviceGetRightWithModelAndUser
	 * ====
	 * Request Var + Parameters:
	 *	- modelId (String): 			ID of the Model	- required
	 *	- userId (String): 				ID of the User	- required
	 */
	function serviceGetRightWithModelAndUser(req, resp) {
		logger.info("<Service> GetRightWithModelAndUser.");
		var getData = parseRequest(req, ['modelId', 'userId']);
		
		writeHeaders(resp);
		getRight(getData.modelId, getData.userId, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify(obj)); 
		});
	}
		 
	/**
	 * deleteRight
	 * ====
	 * Delete the Right corresponding to the given ID
	 * Parameters:
	 *	- id (String): 						ID
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function deleteRight(id, cb) {
		modelRight.findById(id).exec(function (err, item) {
			if (err){
				cb(err, null);
			}
              else {
					modelRight.remove(item, function (err, result) {
						cb(err, result);
					});
              }
       });
	}
	/**
	 * serviceDeleteRight
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceDeleteRight(req, resp) {
		logger.info("<Service> DeleteRight.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		deleteRight(getData.id, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
		});
	}
		
	/**
	 * updateRight
	 * ====
	 * Update the Right corresponding to the given ID
	 * Parameters:
	 *	- id (String): 					ID
	 *	- rightToWrite (bool): 			Flag: false = Read only, true = Read+Write	
	 *	- cb (Function(err, Right[])):	Callback
	 */ 
	function updateRight(id, rightToWrite, cb) {
		modelRight.update({ _id: id }, {rightLevel: rightToWrite}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
			if (err) { logger.error(err); return cb(err, raw); }
			else { return cb(err, 1); }
		});	
	}
	/**
	 * serviceUpdateRight
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		- rightToWrite (bool): 		Flag: false = Read only, true = Read+Write	- required
	 */
	function serviceUpdateRight(req, resp) {
		logger.info("<Service> UpdateRight.");
		var objectsData = parseRequest(req, ['id', 'rightToWrite']);
		
		writeHeaders(resp);
		updateRight(objectsData.id, objectsData.rightToWrite, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
		});
	}		

	/**
	 * updateRightWithModelAndUser
	 * ====
	 * Update the Right corresponding to the given User & Model
	 * Parameters:
	 *	- modelId (String): 			ID of the Model
	 *	- userId (String): 				ID of the User
	 *	- rightToWrite (bool): 			Flag: false = Read only, true = Read+Write	
	 *	- cb (Function(err, Right[])):	Callback
	 */ 
	function updateRightWithModelAndUser(id, rightToWrite, cb) {
		modelRight.update({ _id: id }, {rightLevel: rightToWrite}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
			if (err) { logger.error(err); return cb(err, raw); }
			else { return cb(err, 1); }
		});	
	}
	/**
	 * serviceUpdateRightWithModelAndUser
	 * ====
	 * Request Var + Parameters:
	 *		- modelId (String): 			ID of the Model	- required
	 *		- userId (String): 				ID of the User	- required
	 * Request Parameters:
	 *		- rightToWrite (bool): 		Flag: false = Read only, true = Read+Write	- required
	 */
	function serviceUpdateRightWithModelAndUser(req, resp) {
		logger.info("<Service> UpdateRightWithModelAndUser.");
		var objectsData = parseRequest(req, ['modelId', 'userId', 'rightToWrite']);
		
		writeHeaders(resp);
		updateRightWithModelAndUser(objectsData.modelId, objectsData.userId, objectsData.rightToWrite, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
		});
	}
		 
	/**
	 * deleteRightWithModelAndUser
	 * ====
	 * Delete the Right corresponding to the given given Model and User
	 * Parameters:
	 *	- modelId (String): 			ID of the Model
	 *	- userId (String): 				ID of the User
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function deleteRightWithModelAndUser(modelId, userId, cb) {
		modelRight.findOne({modelId: modelId, userId:userId}).exec(function (err, item) {
			if (err){
				cb(err, null);
			}
              else {
					modelRight.remove(item, function (err, result) {
						cb(err, result);
					});
              }
       });
	}
	/**
	 * serviceDeleteRightWithModelAndUser
	 * ====
	 * Request Var + Parameters:
	 *	- modelId (String): 			ID of the Model	- required
	 *	- userId (String): 				ID of the User	- required
	 */
	function serviceDeleteRightWithModelAndUser(req, resp) {
		logger.info("<Service> DeleteRightWithModelAndUser.");
		var getData = parseRequest(req, ['modelId', 'userId']);
		
		writeHeaders(resp);
		deleteRight(getData.modelId, getData.userId, function (err, user) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
		});
	}	
 
	/**
	 * getRightLevel
	 * ====
	 * Returns the Right's tags
	 * Parameters:
	 *	- id (String): 					ID
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getRightLevel(id, cb) {
		modelRight.findById(id, {__v:0, _id:0, userId:0, modelId:0}).lean().exec(cb);
	}
	/**
	 * serviceGetRightLevel
	 * ====
	 * Request Var:
	 * 		- id (string)		ID
	 * Request Parameters:
	 *		-none
	 */
	function serviceGetRightLevel(req, resp) {
		logger.info("<Service> GetRightLevel.");
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getRightLevel(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({rightToWrite: obj.rightLevel})); 
		});
	}
	
	/**
	 * getRightLevelWithModelAndUser
	 * ====
	 * Returns the Right's tags
	 * Parameters:
	 *	- modelId (String): 			ID of the Model
	 *	- userId (String): 				ID of the User
	 *	- cb (Function(err, Right[])):	Callback
	 */
	function getRightLevelWithModelAndUser(modelId, userId, cb) {
		modelRight.findOne({modelId: modelId, userId:userId}, {__v:0, _id:0, userId:0, modelId:0}).lean().exec(cb);
	}
	/**
	 * serviceGetRightLevelWithModelAndUser
	 * ====
	 * Request Var + Parameters:
	 *	- modelId (String): 			ID of the Model	- required
	 *	- userId (String): 				ID of the User	- required
	 */
	function serviceGetRightLevelWithModelAndUser(req, resp) {
		logger.info("<Service> GetRightLevelWithModelAndUser.");
		var getData = parseRequest(req, ['modelId', 'userId']);
		
		writeHeaders(resp);
		getRightLevelWithModelAndUser(getData.modelId, getData.userId, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({rightToWrite: obj.rightLevel})); 
		});
	}		 

	/**
	 * updateRightLevel
	 * ====
	 * Update the level of the Right corresponding to the given ID
	 * Parameters:
	 *	- id (String): 				ID
	 *	- rightToWrite (bool): 		Level to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateRightLevel(id, rightToWrite, cb) {
			modelRight.update({ _id: id }, {rightLevel: rightToWrite}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
			});
	}
	/**
	 * serviceUpdateRightLevel
	 * ====
	 * Request Var:
	 * 		- id (string)		Username
	 * Request Parameters:
	 *		- rightToWrite (bool): 		Level to change 	- required
	 */
	function serviceUpdateRightLevel(req, resp) {
		logger.info("<Service> UpdateRightLevel.");
		var objData = parseRequest(req, ['id', 'rightToWrite']);
		
		writeHeaders(resp);
		updateRightLevel(objData.id, objData.rightToWrite, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
		});
	}
 	
	/**
	 * updateRightLevelWithModelAndUser
	 * ====
	 * Update the level of the Right corresponding to the given User & Model
	 * Parameters:
	 *	- modelId (String): 			ID of the Model
	 *	- userId (String): 				ID of the User
	 *	- rightToWrite (bool): 		Level to change
	 *	- cb (Function(err, User[])):	Callback
	 */ 
	function updateRightLevelWithModelAndUser(modelId, userId, rightToWrite, cb) {
			modelRight.update({modelId: modelId, userId:userId}, {rightLevel: rightToWrite}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
			});
	}
	/**
	 * serviceUpdateRightLevelWithModelAndUser
	 * ====
	 * Request Var + Parameters:
	 *		- modelId (String): 			ID of the Model	- required
	 *		- userId (String): 				ID of the User	- required
	 * Request Parameters:
	 *		- rightToWrite (bool): 		Level to change 	- required
	 */
	function serviceUpdateRightLevelWithModelAndUser(req, resp) {
		logger.info("<Service> UpdateRightLevelWithModelAndUser.");
		var objData = parseRequest(req, ['modelId', 'userId', 'rightToWrite']);
		
		writeHeaders(resp);
		updateRightLevelWithModelAndUser(objData.modelId, objData.userId, objData.rightToWrite, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
		});
	}
 
 
	/*
	 * ------------------------------------------
	 * RIGHT + USER + MODEL Services
	 * ------------------------------------------
	 */
	 
	 


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
	};
	this.rest['user/:name/id'] = {
		'GET'	: serviceGetUserId
	};
	this.rest['user/:name/email'] = {
		'GET'	: serviceGetUserEmail,
		'PUT'	: serviceUpdateUserEmail
	};
	this.rest['user/:name/password'] = {
		'PUT'	: serviceUpdateUserPassword
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
	
	
	this.rest['rights'] = {
		'POST'	: serviceCreateRight,
		'GET'	: serviceGetRights
	};
	this.rest['right/:id'] = {
		'GET'	: serviceGetRight,
		'DELETE': serviceDeleteRight,
		'PUT'	: serviceUpdateRight
	};
	this.rest['right/:id/level'] = {
		'GET'	: serviceGetRightLevel,
		'PUT'	: serviceUpdateRightLevel
	};
	this.rest['user/:userId/rights'] = {
		'GET'	: serviceGetRightsPerUser
	};
	this.rest['model/:modelId/rights'] = {
		'GET'	: serviceGetRightsPerModel
	};
	this.rest['user/:userId/model/:modelId'] = {
		'GET'	: serviceGetRightWithModelAndUser,
		'PUT'	: serviceUpdateRightWithModelAndUser,
		'DELETE': serviceDeleteRightWithModelAndUser
	};
	this.rest['user/:userId/model/:modelId/level'] = {
		'GET'	: serviceGetRightLevelWithModelAndUser,
		'PUT'	: serviceUpdateRightLevelWithModelAndUser
	};
	this.rest['model/:modelId/user/:userId'] = {
		'GET'	: serviceGetRightWithModelAndUser,
		'PUT'	: serviceUpdateRightWithModelAndUser,
		'DELETE': serviceDeleteRightWithModelAndUser
	};
	this.rest['model/:modelId/user/:userId/level'] = {
		'GET'	: serviceGetRightLevelWithModelAndUser,
		'PUT'	: serviceUpdateRightLevelWithModelAndUser
	};
	 

	this.rest['user/:name/models'] = {
		'GET'	: serviceGetUserModels
	};
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
