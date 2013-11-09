/**
 * =================
 * MODULE - Auth
 * 		by Benjamin (Bill) Planche / Aldream 
 * =================
 * Authentification functions, based on the User model.
 */

var logger = require("./logger");

module.exports = function(modelUser) {
	
	var badPwdError = 'Sorry, couldn\'t find any match. Try again...';
	var handler;

	var authObject = {
		// Inits the auth module.
		// p_handler is the handler of views.
		init: function init(p_handler) {
			handler = p_handler;
		},
		
		// Factory which makes functions that check whether the user is
		// authenticated or not. Returns a function(req, res) which does that, 
		// redirecting to the correct URL.
		checkAuth: function checkAuth(url) {
			// The mecanism obviously must not work if the user is on the
			// login or sign-in page.
			if (url == '/login' || url == '/signin') {
				return handler[url];
			} else {
				return function (req, res) {
					if (!req.session.auth) {
						logger.debug("<Auth> User unauthentified tries to go to " + url);
						res.redirect('/login' + ((url == '/(index)?')?'':'?next=' + url));
					} else {
						handler[url](req, res);
					}		
				}
			}
			return function (req, res) { handler[url](req, res); };
		},
		
		/*
		 * Tries to authenticate the user, and if it works, redirects him to
		 * the page he asked.
		 */
		auth: function auth(req, res) {
			var f_login = req.param("login", null);
			var f_pwd = req.param("password", null);
			var next = req.param("next", null);
			logger.debug("<Auth> Attempt to login: username: " + f_login + ", next: "+ next);
			
			var connectionFn = function(isOk) {
				if (isOk) {
					// The user has been correctly authentified ==> redirects to
					// the page he asked
					req.session.auth = true;
					req.session.username = f_login;
					logger.info("<Auth> Login User " + req.session.username );
						
					if (next == null) {
						// If there was no page, just redirects to index
						logger.info("<Auth> Redirecting to index.");
						res.redirect('/');
					} else if (!handler[next]) {
						// The user tries to go to a page which has no handler.
						logger.info("<Auth> The user tries to go to unavailable page : " + next + ". Redirecting to 404.");
						res.redirect('404');
					} else {
						logger.info("<Auth> Redirecting to " + next);
						handler[next](req, res);
					}
				} else {
					logger.error("<Auth> Bad credentials with login = " + f_login + " and password = " + f_pwd);
					res.render('login', 
						{title: "Login", next: null, error: badPwdError});
				}
			}
			
			modelUser.findOne({ username: f_login }, function(err, user) {
				if (err || !user) return connectionFn(false);
				
				user.comparePassword(f_pwd, function(err, isMatch) {
					if (err) return connectionFn(false);
					connectionFn(isMatch);
				});
			});
		},
		
		/* 
		 * Logs out the current user, if there was one.
		 */
		logout: function logout(req, res) {
			logger.info("<Auth> Logout User " + req.session.username);
			if (req.session.auth !== undefined) {
				req.session.destroy();
			}
			res.redirect('/login');
		}
	};

	return authObject;
}
