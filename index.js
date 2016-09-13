var url = require('url');
var express = require('express');
var querystring = require('querystring');
var async = require('async')
var authenticator = require('./authenticator');
var config = require('./config');
var app = express();

// add cookie parsing functionality to our express app
app.use(require('cookie-parser')());

//take user to twitter login page
app.get('/auth/twitter', authenticator.redirectToTwitterLoginPage);

//this is the callback url that the user is redirected to after signing in
app.get(url.parse(config.oauth_callback).path, function(req,res){
	authenticator.authenticate(req,res,function(err)	{
		if (err) {
			console.log(err);
			res.sendStatus(401);
				 }
		else	 {
			res.send("Authentication Succesfull");
		}
	});
});

//tweet
app.get('/tweet', function(req,res){
	if (!req.cookies.access_token || !req.cookies.access_token_secret){
		return res.sendStatus(401);
	}
	
	authenticator.post('https://api.twitter.com/1.1/statuses/update.json',
	req.cookies.access_token, req.cookies.access_token_secret,
	{
		status: "Hello Twitter REST API test2"
	},
	function(error,data){
		if (error){
			return res.status(400).send(error);
		}
		
		res.send("Tweet Succesfull")
		
	});
});

//upload images
app.get('/upload', function(req,res){
	if (!req.cookies.access_token || !req.cookies.access_token_secret){
		return res.sendStatus(401);
	}
	
	authenticator.post('https://upload.twitter.com/1.1/media/upload.json',
	req.cookies.access_token, req.cookies.access_token_secret,
	{
		media: "C:\Users\arzoorob\twitter-notes\test.png"
	},
	function(error,data){
		if (error){
			return res.status(400).send(error);
		}
		res.send("Picture uploaded")
		
	});
});

//search for tweets
app.get('/search',function(req,res){
	if (!req.cookies.access_token || !req.cookies.access_token_secret){
		return res.sendStatus(401)
	}
	
	authenticator.get('https://api.twitter.com/1.1/search/tweets.json?' + querystring.stringify({q: 'French'}),
		req.cookies.access_token, req.cookies.access_token_secret,
		function(error,data){
			if(error){
				return res.status(400).send(error);
			}
			res.send(data);
		});
});

//list friends
app.get('/friends', function(req,res){
	if(!req.cookies.access_token || !req.cookies.access_token_secret){
		return res.sendStatus(401);
	}
	
	var url = 'https://api.twitter.com/1.1/friends/list.json';
	if (req.query.cursor){
		url += '?' + querystring.stringify({ cursor: req.query.cursor });
	}
	
	authenticator.get(url,
	req.cookies.access_token,req.cookies.access_token_secret,
	function(error,data){
		if(error){
			return res.status(400).send(error);
		}
		res.send(data);
	});
	
});

//start listening for requests
app.listen(config.port, function(){
	console.log("Listening on Port" + config.port);
});
