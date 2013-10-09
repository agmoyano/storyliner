
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , querystring = require('querystring')
  , rs = require('connect-redis')(express)
  , oidc = require('openid-connect').oidc()
  , hashlib = require('hashlib2')
  , request = require('request')
  , providers = {
		storyliner: {
			auth: 'http://localhost:3001/authorization',
			token: 'http://localhost:3001/token',
			flow: 'client_credentials',
			client_id: 'fasfaskfjaskfjñ',
			client_secret: 'fasñklfjsñkldfjslñ',
			scope: 'openid profile'
		}	
	};
  //, serializer = require('serializer').createSecureSerializer('fiajfopasfjaso234ujfaisfjoi', 'fsakjfu39ur98u38uugoeukjaerwui8w');

var app = express();

// all environments
app.set('port', process.env.PORT || 3001);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('3ajji399809sh38000ajjiw@'));
app.use(express.session({store: new rs({host: '127.0.0.1', port: 6379, client: oidc.redisClient}), secret: '3ajji399809sh38000ajjiw@'}));
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
app.get('/', function(req, res) {
  res.redirect('/login');
});
app.get('/authorize', oidc.auth());

app.post('/token', oidc.token());

app.get('/login', routes.login);

app.post('/login', function(req, res, next) {
  delete req.session.error;
  oidc.searchUser(req.body.user, function(err, uid){
    if(!err && uid) {
      var password = hashlib.md5(req.body.password);
      this.getPassword(function(err, storedpwd){
		if(storedpwd == password) {
		  req.session.user = uid;
		  if(req.query.return_url || req.body.return_url) {
		    res.redirect(req.query.return_url || req.body.return_url);
		  }
		} else {
		  req.session.error = 'User or password incorrect.';
		  res.redirect(req.path);
		}
      });
    } else {
		req.session.error = 'User or password incorrect.';
		res.redirect(req.path);      
    }
  }); 
});

app.get('/logout', function(req, res, next) {
	req.session.destroy(function(){
		res.redirect('/login');
	});
});

app.get('/consent', routes.consent);

app.post('/consent', oidc.consent());

app.get('/user/sign-in', function(req, res, next) {
  req.session.create_user = req.session.create_user||{};
  req.session.create_user.fields = mkJadeFields(oidc.getUserParams());
  next();
}, routes.create_user);

app.post('/user/sign-in', function(req, res, next) {
  delete req.session.error;
  var return_url = req.query.return_url || '/user';
  oidc.searchUser(req.body.email, function(err, user) {
    if(!err && user) {
      req.session.error='El usuario ya existe';
      res.redirect(req.path);
    } else {
      req.body.password = hashlib.md5(req.body.password);
      req.body.name = req.body.given_name+' '+req.body.middle_name+' '+req.body.family_name;
      oidc.user(req.body, function(err, id){
	if(!err && id) {
	  req.session.user = id;
	  res.redirect(return_url);
	} else {
	  next(err);
	}
      });
    }
  });
});

app.get('/user', function(req, res, next){
  if(!req.session.user) {
    res.redirect('/login?'+querystring.stringify({return_url: req.path}));
  } else {
	  oidc.user(req.session.user).get(function(err, props){
		  req.session.user_data = req.session.user_data||{};
		  req.session.user_data.fields = mkJadeFields(oidc.getUserParams(), props);
		  next();
	  });
    //res.send('<h1>pagina usuario</h1>');
  }
  
}, routes.user);

app.get('/client/register', function(req, res, next) {
  if(!req.session.user) {
    res.redirect('/login?'+querystring.stringify({return_url: req.path}));
  } else {
    var params=oidc.getClientParams();
    var mkId = function(id) {
      oidc.searchClient(id, function(err, client) {
	if(!err && !client) {
	  params.id.value = id;
	  params.secret.value = hashlib.md5(id+Math.random());
	  req.session.create_client = req.session.create_client||{};
	  req.session.create_client.id = id;
	  req.session.create_client.secret = params.secret.value;
	  req.session.create_client.fields = mkJadeFields(params);
	  next();
	} else if(!err) {
	  mkId(hashlib.md5(req.session.user+Math.random()));
	} else {
	  next(err);
	}
      });
    };
    mkId(hashlib.md5(req.session.user+Math.random()));
  }
}, routes.create_client);

app.post('/client/register', function(req, res, next) {
  req.body.id = req.session.create_client.id;
  req.body.secret = req.session.create_client.secret;
  req.body.user = req.session.user;
  oidc.client(req.body, function(err, id){
    if(id) {
      oidc.user(req.session.user).setRefClients(this);
      res.redirect('/client');
    } else {
      next(err);
    }
  });
});

app.get('/client', function(req, res, next){
  if(!req.session.user) {
    res.redirect('/login?'+querystring.stringify({return_url: req.path}));
  } else {
	oidc.userClients(req.session.user, function(err, clients){
		var html = '<h1>pagina de clientes del usuario</h1><table><thead><th>App Cliente</th><th>App id</th><th>App Secret</th></thead><tbody>';
		clients.forEach(function(i){
			html += '<tr><td>'+i.name+'</td><td>'+i.id+'</td><td>'+i.secret+'</td></tr>';
		});
		html += '</tbody></table>'
		res.send(html);
	});
  }
  
});

app.get('/api/user', oidc.userInfo());

function mkJadeFields(params, values) {
  var fields={};
  values = values||{};
  for(var i in params) {
    if(params[i].html) {
      fields[i] = {};
      fields[i].label = params[i].label||(i.charAt(0).toUpperCase()+i.slice(1)).replace(/_/g, ' ');
      switch(params[i].html) {
		case 'password':
		  fields[i].html = '<input class="form-control" type="password" id="'+i+'" name="'+i+'" placeholder="'+fields[i].label+'"'+(params[i].mandatory?' required':'')+'/>';
		  break;
		case 'date':
		  fields[i].html = '<input class="form-control" type="date" id="'+i+'"'+(values[i]?' value="'+values[i]+'"':'')+' name="'+i+'"'+(params[i].mandatory?' required':'')+'/>';
		  break;
		case 'hidden':
		  fields[i].html = '<input class="form-control" type="hidden" id="'+i+'"'+(values[i]?' value="'+values[i]+'"':'')+' name="'+i+'"/>';
		  fields[i].label = false;
		  break;
		case 'fixed':
		  fields[i].html = '<span class="form-control">'+params[i].value+'</span>';
		  break;
		case 'radio':
		  fields[i].html = '';
		  for(var j=0; j<params[i].ops; j++) {
		    fields[i].html += '<input class="form-control" type="radio" id="'+i+'_'+j+'"'+(values[i] && values[i][j]?' value="'+values[i][j]+'"':'')+' name="'+i+'" '+(params[i].mandatory?' required':'')+'/> '+params[i].ops[j];
		  }
		default:
		  fields[i].html = '<input class="form-control" type="text" id="'+i+'"'+(values[i]?' value="'+values[i]+'"':'')+' name="'+i+'" placeholder="'+fields[i].label+'"'+(params[i].mandatory?' required':'')+'/>';
		  break;
      }
    }
  }
  return fields;
}


app.get('/provider/:provider', function(req, res, next){
	if(providers[req.params.provider]) {
		var provider = providers[req.params.provider];
		var params = {};
		var url = '';
		switch(provider.flow){
		case "authorization_code":
			req.session.state = hashlib.md5(Math.random());
			params = {
				response_type: 'code',
				client_id: provider.client_id,
				scope: provider.scope,
				redirect_uri: req.url+'/callback',
				state: req.session.state
			};
			url = provider.auth;
			break;
		case "implicit":
			break;
		default:
			next(new Error("Unsupported flow "+provider.flow));
		}
		if(url != '') {
			request.get(url+'?'+querystring.stringify(params));
		}
	} else {
		next(new Error("Unsupported provider "+req.params.provider));
	}
});

app.get('/providers/:provider/callback', function(){
	
});

 var clearErrors = function(req, res, next) {
   delete req.session.error;
   next();
 };

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});