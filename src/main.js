var server = require('http').createServer(handleRequest);
var io = require('socket.io')(server);
var db = require('./db');
var _ = require('lodash');

function handleRequest(request, response) {
    response.end('It Works!! Path Hit: ' + request.url);
		console.log('It Works!! Path Hit: ' + request.url);
}

setupSocket();
server.listen(3000, "0.0.0.0");

function setupSocket() {
	io.on('connection', handleConnection);
}

function handleConnection(client) {
	console.log("connection");

	client.on('create_user', (cb) => handleCreateUser(client, cb));
	client.on('login_user', (user, cb) => handleLoginUser(client, user, cb));
  client.on('create_game', (user2, cb) => handleCreateGame(client, user2, cb));
  client.on('join_game', (game) => handleJoinGame(client, game));
  client.on('do_move', (game, move) => handleMove(client, game, move));
}


function handleMove(client, game, move) {
  db.Game.findByIdAndUpdate(game._id, {
    $push: {
      'moves': createMove(move)
    }
  }, {new: true}).exec().then((game) => {
    io.to(game._id).emit('move', game);
  });
}

function handleJoinGame(client, game, cb) {
  console.log('handleJoinGame: ' + game._id);
  db.User.findOne({
    'internal_data.socket_id': client.id
  }).exec().then((user1) => {
    return db.Game.findByIdAndUpdate(game._id, {
      $push: {
        'accepted_ids': user1._id
      }
    }, {new: true}).exec();
  }).then((game) => {
    client.join(game._id, () => {
      io.to(game._id).emit('game_start', game);
    });
  });
}

function createMove(move) {
  var currentDate = new Date();
  return new db.Move({
    'x': move.x,
    'y': move.y,
    'color': move.color,
    'created_at': currentDate
  });
}
function createGame(user1, user2) {
  var currentDate = new Date();
  var ids = [user1._id, user2._id];
  var randomIds = _.sampleSize(ids, 2);
  return new db.Game({
    'ids': ids,
    'accepted_ids': [user1._id],
    'moves': [],
    'black': randomIds[1],
    'white': randomIds[0],
    'current_turn': 'white',
    'created_at': currentDate,
    'updated_at': currentDate,
  });
}

function handleCreateGame(client, user2, cb) {
  console.log('handleCreateGame: ' + user2._id);
  user1Promise = db.User.findOne({
    'internal_data.socket_id': client.id
  }).exec();
  user2Promise = db.User.findById(user2._id).exec();
  var user1, user2, currentGame;
  Promise.all([user1Promise, user2Promise]).then(([user1, user2]) => {
    return createGame(user1, user2).save();
  }).then((game) => {
    client.join(game._id, () => {
      cb(game);
      io.to(user2.internal_data.socket_id).emit('game_invite_sent', game);
    });
  });
}

function getUsersInRoom(room) {
  var minAgo = new Date ();
  minAgo.setMinutes(minAgo.getMinutes() - 5);

  return db.User.find({
    'internal_data.current_room': room,
    'updated_at': {
      "$gte": minAgo
    }
  }).exec();
}

function enterLiveRoom(client, user) {
  enterRoom(client, user, 'live_room').then(([client, user]) => {
    return getUsersInRoom('live_room');
  }).then((users) => {
    io.to('live_room').emit('joined:live_room', users);
  });
}

function enterRoom(client, user, room) {
  console.log(user._id + " joined " + room);
  return new Promise((resolve, reject) => {
    client.join(room, () => {
      db.User.findByIdAndUpdate(user._id, {
        $set: {
          'updated_at': new Date(),
          'internal_data.current_room': room
        }
      }).exec()
        .then((user) => resolve([client, user]))
        .catch((reason) => reject(reason));
    });
	});
}

function handleLoginUserSuccess(client, user) {
  enterLiveRoom(client, user);
  client.on('disconnect', () => handleDisconnect(client, user));
}

function handleLoginUser(client, user, cb) {
  console.log('handleLoginUser: ' + user._id);
  db.User.findByIdAndUpdate(user._id, {
    $set: {
      'updated_at': new Date(),
      'internal_data': {
        'socket_id': client.id,
        'current_room': ''
      }
    }
  }).exec().then((user) => {
    console.log(JSON.stringify(user));
    cb(user);
    handleLoginUserSuccess(client, user);
  });
}

function handleCreateUser(client, cb) {
  var currentDate = new Date();
  var newUser = new db.User({
    'name': 'Bogdan_' + Date.now(),
    'rating': 1,
    'internal_data': {
      'socket_id': client.id,
      'current_room': ''
    },
    'created_at': currentDate,
    'updated_at': currentDate,
  });
  console.log('handleCreateUser: ' + newUser);
  newUser.save().then((user) => {
    console.log(JSON.stringify(user));
    cb(user);
    handleLoginUserSuccess(client, user);
  });
}

function handleDisconnect(client, user) {
	console.log('disconnect');
  db.User.findByIdAndUpdate(user._id, {
    $set: {
      'internal_data': {
        'socket_id': '',
        'current_room': ''
      }
    }
  }).exec();
}
