/**
 * =================
 * MODULE - Authentification
 * =================
 * Manage the authentification and sessions
 */

var LocalStrategy = require('passport-local').Strategy,
	OpenIDStrategy = require('passport-openid').Strategy,
	logger = require("./logger");

module.exports = function(passport, modelUser, config) {

	passport.use(new LocalStrategy(
			function(username, password, done) {
				modelUser.findOne({ username: username }, {password:1}, function (err, user) {
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
		
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		modelUser.findById(id, function(err, user) {
			done(err, user);
		});
	});

	passport.use(new OpenIDStrategy(
			{
				returnURL: config.getProperty("http.address")+":"+config.getProperty("http.port")+'/auth/openid/return',
				realm: config.getProperty("http.address")+":"+config.getProperty("http.port")
			},
			function(identifier, profile, done) {
					logger.error(JSON.stringify(profile));
				modelUser.findOneAndUpdate({ username: identifier }, { openId: identifier, email: profile.emails[0].value }, {upsert: true}, function(err, user) {
					if (err) { logger.error(err); };
					logger.error(JSON.stringify(user));
					done(err, user);
				});
			}
		));
}
