/**
 * =================
 * MODULE - Authentification
 * =================
 * Manage the authentification and sessions
 */

var LocalStrategy = require('passport-local').Strategy,
	OpenIDStrategy = require('passport-openid').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
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
		
	passport.use(new FacebookStrategy({
			clientID: config.getProperty("facebook.id"),
			clientSecret: config.getProperty("facebook.secret"),
			callbackURL: config.getProperty("http.address")+":"+config.getProperty("http.port")+'/auth/facebook/callback'
		},
		function(accessToken, refreshToken, profile, done) {
			var emails = [];
			for (var i in profile.emails) {
				emails.push(profile.emails[i].value);
			}
			modelUser.find().where('emails').in(emails).exec(function(err, users) {
				if (err) { done(err, null); return; }
				if (users.length > 1) {
					// TO DO: Handle the possibility of multiple email addresses returned by FB (and what they correspond to different 3Dpal accounts?)
					done(null, users[0]); return;
				}
				else if (users.length == 1) {
					done(null, users[0]); return;
				}	
				else {
					// TO DO: Handle case if profile.username already taken
					var user = new modelUser({username: profile.username, email: emails[0]});
					user.save(function(err) {
						if (err) { logger.error(err); done(err, null); return; }
						done(err, user);
					});
				}
			});
		}
		
));
}
