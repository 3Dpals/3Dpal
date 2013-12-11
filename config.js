/**
 * =================
 * MODULE - Config
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Global properties
 */
 
var config = {
	"logger" : {
		"level" : "debug",
		"printDate" : false
	},
	"security" : {
		"ssl" : false,
		"auth" : true
	},
	"http" : {
		"address": process.env.publicURL || "http://localhost:8080",
		"port" : process.env.PORT || 8080
	},
	"db": {
		"uri" :	process.env.MONGOHQ_URL || 'mongodb://localhost/3dpal'
	},
	"session" : {
		"secret" : "One does not simply walk into this website."
	},
	"facebook" : {
		"id" : (process.env.publicURL) ? "604521206263441" :"636773756380634",
		"secret" : (process.env.publicURL) ? "645bb68d0a49d69e08b9bd6c6786ed8c" : "80d651a213387f6edfa4504ca7b1dc86" // TO BE RESET & HIDDEN ONCE TESTING DONE
	}
};

/* Object getProperty(String name)
* Get the property of an object by specifying the path (like
* "logger.level")
*/
function getProperty(name) {
	var path = name.split('.');
	var obj = config;
	for(var i in path) {
		var elem = path[i];
		if(!obj[elem]) return undefined;
			obj=obj[elem];
	}
	return obj;
}

exports.getProperty = getProperty;
