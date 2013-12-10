/**
 * =================
 * SCHEMA - User
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines an user of 3Dpal services.
 */
 
var	bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10;
 
module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var UserSchema = new Schema({
		username: { type: String, required: true },								// Unique username
		password: { type: String, required: false, select: false },				// Protected password
		email: { type: String, required: true },								// Email (also use to retrieve Gravatar's pic)
		writeModels: [{ type: Schema.Types.ObjectId, ref: 'Model' }],			// Models the User got personally the right to edit
		readModels: [{ type: Schema.Types.ObjectId, ref: 'Model' }],			// Models the User got personally the right to read
		openId: { type: String, required: false},								// OpenID
		googleId: { type: String, required: false},								// Google ID
		facebookId: { type: String, required: false},							// Facebook ID
		token: { type: String, required: true, select: false, unique: true }	// Token to access the API
	});

	UserSchema.pre('save', function(next) {
		var user = this;

		// only hash the password if it has been modified (or is new)
		if (!user.isModified('password')) return next();

		// generate a salt
		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if (err) return next(err);

			// hash the password using our new salt
			bcrypt.hash(user.password, salt, function(err, hash) {
				if (err) return next(err);

				// override the cleartext password with the hashed one
				user.password = hash;
				next();
			});
		});
	});

	/**
	 * comparePassword
	 * ====
	 * Checks if an input password match the User's one.
	 * Parameters:
	 *	- candidatePassword (String): 	Input password
	 *	- cb (Function(err, bool)):		Callback
	 */
	UserSchema.methods.comparePassword = function(candidatePassword, cb) {
		bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
			if (err) return cb(err);
			cb(null, isMatch);
		});
	};
	
	/**
	 * generateToken
	 * ====
	 * Generates the unique token to access the API
	 * Parameters:
	 *	- cb (Function(err, User)):		Callback
	 */
	UserSchema.methods.generateToken = function(username, cb) {
		// generate API token:
		bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			if (err) { return cb(err, null); }
			var token = username + (new Date().toString());
			// hash the password using our new salt
			bcrypt.hash(token, salt, function(err, hash) {
				if (err) { logger.error(err); return cb(err, null); }

				cb(err, hash);
			});
		});	
	}

	/**
	 * toString
	 * ====
	 * Stringifies
	 * Return: String
	 */
	UserSchema.methods.toString = function() {
		return '{name:'+this.name+',password:'+this.password+',email:'+this.email+'}';
	};

	this.model = mongoose.model('User', UserSchema);

	return this;
}

