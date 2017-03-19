function handleRequest(request, response) {
    response.end('It Works!! Path Hit: ' + request.url);
		console.log('It Works!! Path Hit: ' + request.url);
}

var server = require('http').createServer(handleRequest);
var io = require('socket.io')(server);
var db = require('./db');

setupSocket();
server.listen(3000, "0.0.0.0");

function setupSocket() {
	io.on('connection', handleConnection);
}

function handleConnection(client) {
	console.log("connection");

	client.on('disconnect', () => handleDisconnect(client));
	client.on('create_user', (cb) => handleCreateUser(client, cb));
	client.on('login_user', (user, cb) => handleLoginUser(client, user, cb));
	enterPendingGameRoom(client);
}

function handleDisconnect(client) {
	console.log('disconnect');
}

function enterPendingGameRoom(client) {
	console.log('enterPendingGameRoom');
	client.join('pending_game', () => {
		io.to('pending_game').emit('joined_pending_game');
	});
}
function handleLoginUser(client, user, cb) {
  console.log('handleLoginUser: ' + user._id);
  db.User.findByIdAndUpdate(user._id, {
    $set: {
      'lastLoggedIn': new Date()
    }
  }, (err, user) => {
    console.log(JSON.stringify(user));
    if (err) {
      console.log("failed to login user");
      // cb(null);
    } else {
        cb(user);
    }
  });
}
function handleCreateUser(client, cb) {
  var newUser = new db.User({
    'name': 'Bogdan_' + Date.now(),
    'rating': 1,
    'lastLoggedIn': new Date()
  });
  console.log('handleCreateUser: ' + newUser);
  newUser.save((err) => {
    if (err) {
      console.log("failed to create user:" + err);
      // cb(null);
    } else {
      cb(newUser);
    }
  });
}
