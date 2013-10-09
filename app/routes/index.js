/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Storyliner' });
};

exports.app = function(req, res){
	res.render('app', { title: 'Storyliner' });	
};

exports.listen = function(server) {
  ///////////// SOCKET IO ////////////////////
  var io = require('socket.io').listen(server);

  io.sockets.on('connection', function(socket) {
    
  });
}