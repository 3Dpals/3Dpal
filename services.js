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
	 * ModelExample - CRUD Services
	 * ------------------------------------------
	 */
	 
	/**
	 * createModelExample
	 * ====
	 * Create a ModelExample.
	 * Parameters:
	 *	- my1stField (String): 		Whatever
	 *	- my2ndField (Int): 		Whatever
	 *	- cb (Function(bool)):		Callback
	 */
	function createModelExample(my1stField, my2ndField, cb) {
		modelUser.findOne({ username: username }, function(err, user) {
			var example = new ModelExample({my1stField: my1stField, my2ndField: my2ndField});
			example.save(function(err) {
				if (err) cb(false);
				else cb (true);
			});
		});
	}
	function serviceCreateModelExample(req, resp) {
		logger.info("<Service> CreateModelExample.");
		var exData = parseRequest(req, ['my1stField', 'my2ndField']);
		
		writeHeaders(resp);
		createModelExample(exData.my1stField, exData.my2ndField, function(success) { resp.end(JSON.stringify({ success: success })); });
	}

	/* TODO: implement other services */
	
	
	this.rest = {};
	this.rest.createModelExample = serviceCreateModelExample;

	this.local = {};
	this.local.createModelExample = createModelExample;
	return this;
};
