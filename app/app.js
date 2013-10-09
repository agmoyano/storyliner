
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , login = require('./routes/login')
  , model = require('storyliner-model')
  , http = require('http')
  , path = require('path')
  , i18n = require('i18next')
  , RedisStore = new (require('connect-redis')(express))({host: '127.0.0.1', port: 6379, client: model.client})
  , request = require('request')
  , hashlib = require('hashlib2')
  , querystring = require('querystring')
  , cookie = require('cookie');

i18n.init({
  saveMissing: true,
  debug: true,
  sendMissingTo: 'all'
});

var app = express();
var account = 'http://localhost:3001';

// all environments
app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.use(i18n.handle);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('3ajji399809sh38000ajjiw@'));
  app.use(express.session({store: RedisStore, secret: '3ajji399809sh38000ajjiw@'}));
  app.use(app.router);
  app.use(require('less-middleware')({src: __dirname + '/public'}));
  app.use(express.static(path.join(__dirname, 'public')));
});

i18n.registerAppHelper(app);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

app.get('/app', function(req, res, next) {
	if(!req.session.user) {
		request.get(account+'/api/user', function(e, r, body){
			if(r.statusCode < 400) {
				req.session.user = body.sub;
				next();
			} else {
				var fullURL = req.protocol + "://" + req.get('host') + req.url;
				res.redirect(account+'/login?'+querystring.stringify({return_url: fullURL}));
			}
		})
	} else {
		next();
	}

},routes.app);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);

io.configure(function() {
	io.set('authorization', function(data, callback){
		if(data.headers.cookie) {
			var cookies = cookie.parse(data.headers.cookie);
			
			if(cookies['connect.sid']) {
				RedisStore.get(cookies['connect.sid'].substr(2).split('.')[0], function(err, session) {
					if(err) {
						callback(err, false);
					} else {
						data.session = session;
						callback(null, true);
					}
				});
			} else {
				callback("No session cookie found.", false);
			}
		} else {
			callback("No session cookie found.", false);
		}
	});	
});

io.sockets.on('connection', function(socket){
	
});
//login.listen(server);
