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
		modelUser.findOne({name: name}).select('_id').lean().exec(cb);
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
		modelUser.findOne({name: name}).select('email').lean().exec(cb);
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
		modelModel.findById(id).select('creator').lean().exec(cb);
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
	 * addRight
	 * ====
	 * Add a Right
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- userId (String): 			ID of the user
	 *	- rightToWrite (bool): 		Flag: false = Read only, true = Read+Write	
	 *	- cb (Function(bool)):		Callback
	 */
	function addRight(modelId, userId, rightToWrite, cb) {
		getUserId(userId, function(err, id){
			if (err) { return cb(err, null); }
			if (!id) { return cb(null, 'User doesn\'t exist'); }
			id = id._id;
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
		});
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
		var objectsData = parseRequest(req, ['modelId', 'userId', 'rightToWrite']);
		
		writeHeaders(resp);
		addRight(objectsData.modelId, objectsData.userId, objectsData.rightToWrite, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}

	/**
	 * addCompleteRight
	 * ====
	 * Add a Right to Write & Read
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- userId (String): 			ID of the user
	 *	- cb (Function(bool)):		Callback
	 */
	function addCompleteRight(modelId, userId, cb) {
		getUserId(userId, function(err, id){
			if (err) { return cb(err, null); }
			if (!id) { return cb(null, 'User doesn\'t exist'); }
			id = id._id;
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
		var objectsData = parseRequest(req, ['modelId', 'userId']);
		
		writeHeaders(resp);
		addCompleteRight(objectsData.modelId, objectsData.userId, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}

	/**
	 * addReadRight
	 * ====
	 * Add a Right to Read
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- userId (String): 			ID of the user
	 *	- cb (Function(bool)):		Callback
	 */
	function addReadRight(modelId, userId, cb) {
		getUserId(userId, function(err, id){
			if (err) { return cb(err, null); }
			if (!id) { return cb(null, 'User doesn\'t exist'); }
			id = id._id;
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
		var objectsData = parseRequest(req, ['modelId', 'userId']);
		
		writeHeaders(resp);
		addReadRight(objectsData.modelId, objectsData.userId, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}
		
	/**
	 * removeRight
	 * ====
	 * Remove a Right
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- userId (String): 			ID of the user
	 *	- rightToWrite (bool): 		Flag: true = remove Write only, false = remove Write+Read
	 *	- cb (Function(bool)):		Callback
	 */
	function removeRight(modelId, userId, rightToWrite, cb) {
		getUserId(userId, function(err, id){
			if (err) { return cb(err, null); }
			if (!id) { return cb(null, 'User doesn\'t exist'); }
			id = id._id;
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
		});
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
	function serviceRemoveRight(req, resp) {
		logger.info("<Service> RemoveRight.");
		var objectsData = parseRequest(req, ['modelId', 'userId', 'rightToWrite']);
		
		writeHeaders(resp);
		removeRight(objectsData.modelId, objectsData.userId, objectsData.rightToWrite, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}
		
	/**
	 * removeCompleteRight
	 * ====
	 * Remove a Right to Write & Read
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- userId (String): 			ID of the user
	 *	- cb (Function(bool)):		Callback
	 */
	function removeCompleteRight(modelId, userId, cb) {
		getUserId(userId, function(err, id){
			if (err) { return cb(err, null); }
			if (!id) { return cb(null, 'User doesn\'t exist'); }
			id = id._id;
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
		var objectsData = parseRequest(req, ['modelId', 'userId']);
		
		writeHeaders(resp);
		removeCompleteRight(objectsData.modelId, objectsData.userId, objectsData.rightToWrite, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
		});
	}
		
	/**
	 * removeWriteRight
	 * ====
	 * Remove a Right to Write & Read
	 * Parameters:
	 *	- modelId (String): 		ID of the model
	 *	- userId (String): 			ID of the user
	 *	- cb (Function(bool)):		Callback
	 */
	function removeWriteRight(modelId, userId, cb) {
		getUserId(userId, function(err, id){
			if (err) { return cb(err, null); }
			if (!id) { return cb(null, 'User doesn\'t exist'); }
			id = id._id;
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
		var objectsData = parseRequest(req, ['modelId', 'userId']);
		
		writeHeaders(resp);
		removeWriteRight(objectsData.modelId, objectsData.userId, objectsData.rightToWrite, function(err, status) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: status }));
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
		var getData = parseRequest(req, ['userId', 'limit', 'offset']);
		
		writeHeaders(resp);
		getPersonallyReadableModels(getData.userId, getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ readModels: objects })); 
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
		var getData = parseRequest(req, ['userId', 'limit', 'offset']);
		
		writeHeaders(resp);
		getPersonallyEditableModels(getData.userId, getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ writeModels: objects })); 
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
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getPubliclyReadableModels(getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ models: objects })); 
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
		var getData = parseRequest(req, ['limit', 'offset']);
		
		writeHeaders(resp);
		getPubliclyEditableModels(getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ models: objects })); 
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
		var getData = parseRequest(req, ['modelId', 'limit', 'offset']);
		
		writeHeaders(resp);
		getWriters(getData.modelId, getData.limit, getData.offset, function (err, objects) {
			logger.error(err);
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ writers: objects })); 
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
		var getData = parseRequest(req, ['modelId', 'limit', 'offset']);
		
		writeHeaders(resp);
		getReaders(getData.modelId, getData.limit, getData.offset, function (err, objects) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ readers: objects })); 
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
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelPublicRead(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({publicRead: obj.publicRead})); 
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
		var getData = parseRequest(req, ['id']);
		
		writeHeaders(resp);
		getModelPublicWrite(getData.id, function (err, obj) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({publicWrite: obj.publicWrite})); 
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
			modelModel.update({ _id: id }, {publicRead: flag}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
			});
	}
	/**
	 * serviceUpdateModelPublicRead
	 * ====
	 * Request Var:
	 * 		- id (string)		Username
	 * Request Parameters:
	 *		- flag (bool): 		Flag Value		- required
	 */
	function serviceUpdateModelPublicRead(req, resp) {
		logger.info("<Service> UpdateModelPublicRead.");
		var objData = parseRequest(req, ['id', 'publicRead']);
		
		writeHeaders(resp);
		updateModelPublicRead(objData.id, objData.tags, function(err, success) {
			if (err) error(2, resp);
			else resp.end(JSON.stringify({ status: 1 })); 
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
			modelModel.update({ _id: id }, {publicWrite: flag}, { upsert: true, multi: false }, function (err, numberAffected, raw) {
					if (err) { logger.error(err); return cb(err, raw); }
					else { return cb(err, 1); }
			});
	}
	/**
	 * serviceUpdateModelPublicWrite
	 * ====
	 * Request Var:
	 * 		- id (string)		Username
	 * Request Parameters:
	 *		- flag (bool): 		Flag Value		- required
	 */
	function serviceUpdateModelPublicWrite(req, resp) {
		logger.info("<Service> UpdateModelPublicWrite.");
		var objData = parseRequest(req, ['id', 'publicWrite']);
		
		writeHeaders(resp);
		updateModelPublicWrite(objData.id, objData.tags, function(err, success) {
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
