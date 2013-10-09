
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.login = function(req, res){
  res.render('login', { return_url: req.query.return_url, error: req.session.error });
};

exports.consent = function(req, res) {
  res.render('consent', {return_url: req.query.return_url, scopes: req.session.scopes});
};

exports.create_user = function(req, res) {
  res.render('form', {title: 'Crear Usuario', fields: req.session.create_user.fields, error: req.session.error});
};

exports.user = function(req, res) {
  res.render('form', {title: 'Usuario', fields: req.session.user_data.fields, error: req.session.error});
};

exports.create_client = function(req, res) {
  res.render('form', {title: 'Crear Cliente', fields: req.session.create_client.fields, error: req.session.error});
};