/**
 * Dependencies
 */
var http = require('http'),
	rest = require('./managers/rest'),
	dbcfg = require('./config/db'),
	mongodb = require('mongodb');
	
/**
 * mongodb instance
 */	
var DB =  new mongodb.Db(dbcfg.DB_NAME, new mongodb.Server(dbcfg.DB_ADDRESS, dbcfg.DB_PORT, {auto_connect: true}));

/**
 * Create the server 
 */
function createServer(){
	http.createServer(function (req, res) {
		rest.controller(req,res,DB);
	}).listen(8080);
}

DB.open(function(){
	DB.authenticate(dbcfg.DB_USER, dbcfg.DB_PASSWORD, function(){
		createServer();
	});
});