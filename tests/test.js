io = require('socket.io-client');
_ = require('lodash');

USERS_NR = 3;
USERS = {};
USERS_SOCKETS = {};
GAMES = {};

function testOne(i) {
  var socket = io('http://localhost:3000', {
    forceNew: true
  });
  user1 = null;
  USERS_SOCKETS[i] = socket;

  socket.on('connect', function() {
    console.log(i + ':connect');
    socket.emit('create_user', (user) => {
      console.log(i + ':create_user:' + user._id);
      user1 = user;
      USERS[i] = user;
    });
  });

  socket.on('disconnect', (data) => {
    console.log(i + ':disconnect');
  });

  socket.on('joined:live_room', (data) => {
    console.log(i + ':joined:live_room:' + _.map(data, '_id'));
  });

  socket.on('game_invite_sent', (game) => {
    console.log(i + ':game_invite_sent:' + game._id);
    socket.emit('join_game', game);
  });

  socket.on('game_start', (game) => {
    console.log(i + ':game_start:' + game._id);
  });

  socket.on('move', (game) => {
      console.log(i + ':move:' + game._id + ":" + _.map(game.moves, (move) => {
      return '(' + move.x + ',' + move.y + ')';
    }));
  });
}

function createGameWith(socket, i, user1, user2) {
  console.log(i + ':create_game:' + user1._id + ':' + user2._id);
  socket.emit('create_game', user2, (game) => {
    console.log(i + ':create_game:ok:' + game._id);
    GAMES[i] = game;
  });
}

function doMove(socket, i, game, move) {
  console.log(i + ':doMove:' + move.x + ":" + move.y + ":" + move.color);
  socket.emit('do_move', game, move);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  for (var i = 0; i < USERS_NR; i ++) {
    testOne(i);
    await sleep(1000);
  }
  await sleep(2000);
  createGameWith(USERS_SOCKETS[0], 0, USERS[0], USERS[2]);
  await sleep(2000);
  doMove(USERS_SOCKETS[0], 0, GAMES[0], {x: 1, y: 2, color: -1});
  await sleep(2000);
  doMove(USERS_SOCKETS[2], 2, GAMES[0], {x: 3, y: 6, color: 1});
  await sleep(2000);
  doMove(USERS_SOCKETS[0], 0, GAMES[0], {x: 4, y: 4, color: -1});
  await sleep(2000);
  doMove(USERS_SOCKETS[2], 2, GAMES[0], {x: 6, y: 5, color: 1});
  await sleep(2000);
}

main();
