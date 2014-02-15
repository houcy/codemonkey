/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var socket = require('socket.io');
var models = require('./models/models.js');
var gamesocket = require('./socket/game.js');


var app = express();

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('DOESNT MATTER'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/play', routes.play);
app.get('/users', user.list);
app.get('/testsocket', routes.testsocket);
app.get('/models.js', function (req,res) {
  res.sendfile(__dirname + '/models/models.js');
});

app.post('/', function (req, res) {
	var name = req.body['name'];	
	res.redirect('/play?n=' + name);
});

// Server setups
var server = http.createServer(app);
server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
var io = socket.listen(server);
io.set('log level', 1);
var gameState = new models.GameState();
gamesocket(gameState, io);
