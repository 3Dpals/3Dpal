/**
 * =================
 * MODULE - Authentification
 * =================
 * Manage the authentification and sessions
 */

var LocalStrategy = require('passport-local').Strategy,
	OpenIDStrategy = require('passport-openid').Strategy,
	FacebookStrategy = require('passport-facebook').Strategy,
	GoogleStrategy = require('passport-google').Strategy;
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
				modelUser.findOneAndUpdate({ openId: identifier }, { email: profile.emails[0].value }, {upsert: true}, function(err, user) {
					if (err) { logger.error(err); };
					if (!user.username) {
						user.username = identifier;
						user.save(function(err) { if (err) { logger.error(err); }; });
					}
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
			logger.error(JSON.stringify(profile));
			modelUser.findOneAndUpdate({ facebookId: profile.id }, { email: profile.emails[0].value }, {upsert: true}, function(err, user) {
				if (err) { logger.error(err); };
				if (!user.username) {
					user.username = profile.username;
					user.save(function(err) { if (err) { logger.error(err); }; });
				}
				done(err, user);
			});
//			var emails = [];
//			for (var i in profile.emails) {
//				emails.push(profile.emails[i].value);
//			}
//			modelUser.find().where('emails').in(emails).exec(function(err, users) {
//				if (err) { done(err, null); return; }
//				if (users.length > 1) {
//					// TO DO: Handle the possibility of multiple email addresses returned by FB (and what they correspond to different 3Dpal accounts?)
//					done(null, users[0]); return;
//				}
//				else if (users.length == 1) {
//					done(null, users[0]); return;
//				}	
//				else {
//					// TO DO: Handle case if profile.username already taken
//					var user = new modelUser({username: profile.username, email: emails[0]});
//					user.save(function(err) {
//						if (err) { logger.error(err); done(err, null); return; }
//						done(err, user);
//					});
//				}
//			});
		}	
	));
	
	passport.use(new GoogleStrategy({
			returnURL: config.getProperty("http.address")+":"+config.getProperty("http.port")+'/auth/google/return',
			realm: config.getProperty("http.address")+":"+config.getProperty("http.port")
		},
		function(identifier, profile, done) {
			logger.error(JSON.stringify(profile));
			modelUser.findOneAndUpdate({ googleId: identifier }, { email: profile.emails[0].value }, {upsert: true}, function(err, user) {
				if (err) { logger.error(err); };
				if (!user.username) {
					user.username = profile.displayName;
					user.save(function(err) { if (err) { logger.error(err); }; });
				}
				done(err, user);
			});
			
//			var emails = [];
//			for (var i in profile.emails) {
//				emails.push(profile.emails[i].value);
//			}
//			modelUser.find().where('emails').in(emails).exec(function(err, users) {
//				if (err) { done(err, null); return; }
//				if (users.length > 1) {
//					// TO DO: Handle the possibility of multiple email addresses returned by FB (and what they correspond to different 3Dpal accounts?)
//					if (!users[0].openid) {
//						users[0].openid = identifier;
//						users[0].save(function(err) {
//							if (err) { logger.error(err); done(err, null); return; }
//							done(err, users[0]);
//						});
//					}
//					else { done(null, users[0]); return; }
//				}
//				else if (users.length == 1) {
//					if (!users[0].openid) {
//						users[0].openid = identifier;
//						users[0].save(function(err) {
//							if (err) { logger.error(err); done(err, null); return; }
//							done(err, users[0]);
//						});
//					}
//					else { done(null, users[0]); return; }
//				}	
//				else {
//					// TO DO: Handle case if profile.username already taken
//					var user = new modelUser({username: identifier, email: emails[0], openid: identifier});
//					user.save(function(err) {
//						if (err) { logger.error(err); done(err, null); return; }
//						done(err, user);
//					});
//				}
//			});;
		  }
	));
}
