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
		name: { type: String, required: true, index: { unique: true } },	// Unique username
		password: { type: String, required: true },							// Protected password
		email: { type: String, required: true }
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

	UserSchema.methods.toString = function() {
		return '{name:'+this.name+',password:'+this.password+',email:'+this.email+'}';
	};

	this.model = mongoose.model('User', UserSchema);

	return this;
}

