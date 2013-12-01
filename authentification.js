/**
 * =================
 * MODULE - Authentification
 * =================
 * Manage the authentification and sessions
 */

var LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport, modelUser) {

	passport.use(new LocalStrategy(
		function(username, password, done) {
			modelUser.findOne({ username: username }, function (err, user) {
				if (err) { return done(err); }
				if (!user) {
					return done(null, false, { message: 'Incorrect username.' });
				}
				user.comparePassword(password, function(err, isMatch) {
					if (err ) { return done(err); }
					if (!isMatch) {
						return done(null, false, { message: 'Incorrect password.' });
					}
					else {
						return done(null, user);
					}
				});
			});
		}
	));
}
