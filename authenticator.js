var OAuth = require('oauth').OAuth;
var config = require('./config');

//create the oauth object for accessing twitter
var oauth = new OAuth(
	config.request_token_url,
	config.access_token_url,
	config.consumer_key,
	config.consumer_secret,
	config.oauth_version,
	config.oauth_callback,
	config.oauth_signature
);

module.exports = {

	get: function(url,access_token,access_token_secret,cb){
		oauth.get.call(oauth,url,access_token,access_token_secret,cb)	
	},
	post: function(url, access_token,access_token_secret,body,cb){
		oauth.post.call(oauth,url,access_token,access_token_secret,body,cb)
	},
	
	redirectToTwitterLoginPage: function(req, res) {
	//ask twitter for request token
	oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
		if(error){
			console.log(error);
			res.send("Authentication failed");
			
		} else{
			//use the request token to take the user to twitter's authentication
			res.cookie('oauth_token', oauth_token, {httpOnly: true});
			res.cookie('oauth_token_secret', oauth_token_secret, {httpOnly: true});
			res.redirect(config.authorize_url + '?oauth_token='+oauth_token);
		}
		
	});
		
	},
	authenticate: function(req, res, cb){
		//check if request token and temporary credential are there
		if(!(req.cookies.oauth_token && req.cookies.oauth_token_secret && req.query.oauth_verifier)){
			return cb("Request does not have all required keys");
		}
		
		//clear all the request token data from the cookies
		res.clearCookie('oauth_token');
		res.clearCookie('oauth_token_secret');
		
		//exchange oauth verifier for an access token
		oauth.getOAuthAccessToken(
			req.cookies.oauth_token,
			req.cookies.oauth_token_secret,
			req.query.oauth_verifier,
			function(error,oauth_access_token,oauth_access_token_secret, results){
				if(error){
					return cb(error);
				}
				
				//get the user's twitter ID
				 oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json',
				 oauth_access_token, oauth_access_token_secret,
				 function(error,data){
					 if(error){
						 console.log(error);
						 return cb(error);
					 }
					 
					 //parse the JSON response
					 data = JSON.parse(data);
					 
					 //store the access token, access token secret, and user's twitter ID in cookies
					 res.cookie('access_token', oauth_access_token, {httpOnly: true});
					 res.cookie('access_token_secret', oauth_access_token_secret,{httpOnly: true});
					 res.cookie('twitter_id', data.id_str, {httpOnly: true});
					 
					//tell the router that the authentication was succesfull
					cb();
	});
	});
	}
}