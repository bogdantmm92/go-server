function handleRequest(request, response) {
    response.end('It Works!! Path Hit: ' + request.url);
		console.log('It Works!! Path Hit: ' + request.url);
}

var server = require('http').createServer(handleRequest);
var io = require('socket.io')(server);
io.on('connection', (client) => {
	console.log("connection");
  client.on('event', (data) => {
  	console.log("event");
  });
  client.on('disconnect', () => {
  	console.log("disconnect");
  });
});
server.listen(3000, "0.0.0.0");
