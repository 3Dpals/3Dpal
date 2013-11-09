/**
 * =================
 * SCHEMA - User
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Defines an 3Dpal user.
 */
 
var	bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10;
 
module.exports = function(mongoose) {
	var Schema = mongoose.Schema;
	var UserSchema = new Schema({
		username: { type: String, required: true, index: { unique: true } },	// Unique username
		password: { type: String, required: true }								// Protected password
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

	UserSchema.methods.comparePassword = function(candidatePassword, cb) {
		bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
			if (err) return cb(err);
			cb(null, isMatch);
		});
	};

	this.model = mongoose.model('User', UserSchema);

	return this;
}

