io = require('socket.io-client');
_ = require('lodash');

USERS_NR = 3;
USERS_BY_SOCKET_ID = {};
SOCKETS_BY_USER_ID = {};
GAMES_BY_USER_ID = {};

function connectUser() {
  var socket = io('http://localhost:3000', {
    forceNew: true
  });
  var user;
  socket.on('disconnect', (data) => {
    console.log(user._id + ':disconnect');
  });

  socket.on('joined:live_room', (data) => {
    console.log(user._id + ':joined:live_room:' + _.map(data, '_id'));
  });

  socket.on('game_invite_sent', (game) => {
    console.log(user._id + ':game_invite_sent:' + game._id);
    socket.emit('join_game', game);
  });

  socket.on('game_start', (game) => {
    console.log(user._id + ':game_start:' + game._id);
  });

  socket.on('move', (game) => {
      console.log(user._id + ':move:' + game._id + ":" + _.map(game.moves, (move) => {
      return '(' + move.x + ',' + move.y + ')';
    }));
  });
  return new Promise((resolve, reject) => {
    socket.on('connect', function() {
      console.log('connect');
      socket.emit('create_user', (err, usr) => {
        if (err != null) {
          reject(err);
        } else {
          user = usr;
          console.log(user._id + ':create_user:' + user._id);
          USERS_BY_SOCKET_ID[socket.id] = user;
          SOCKETS_BY_USER_ID[user._id] = socket;
          resolve();
        }
      });
    });
  });
}

function createGameWith(socket, user1, user2) {
  console.log(user1._id + ':create_game:' + user1._id + ':' + user2._id);
  return new Promise((resolve, reject) => {
    socket.emit('create_game', user2, (err, game) => {
      if (err != null) {
        reject(err);
      } else {
        console.log(user1._id + ':create_game:ok:' + game._id);
        GAMES_BY_USER_ID[user1._id] = game;
        GAMES_BY_USER_ID[user2._id] = game;
        resolve(game);
      }
    });
  });
}

function doMove(socket, game, move) {
  console.log(USERS_BY_SOCKET_ID[socket.id] + ':doMove:' + move.x + ":" + move.y + ":" + move.color);
  return new Promise((resolve, reject) => {
    socket.emit('do_move', game, move, (err, result) => {
      if (err != null) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectUsers() {
  for (var i = 0; i < USERS_NR; i ++) {
    await connectUser();
  }
}

async function createGame() {
  var users = _.values(USERS_BY_SOCKET_ID)
  var user1 = _.first(users);
  var user2 = _.last(users);
  return await createGameWith(SOCKETS_BY_USER_ID[user1._id], user1, user2);
}

describe('Error tests', function() {
  this.timeout(15000);
  it('invalid turn, same color: white', async () => {
    await connectUsers();
    let game = await createGame();
    await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 1, y: 2, color: 1});
    await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 3, y: 2, color: -1});
    try {
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 3, y: 6, color: -1});
      return Promise.reject();
    } catch(e) {
      return Promise.resolve(e);
    }
  });
  it('invalid turn, same color: black', async () => {
    await connectUsers();
    let game = await createGame();
    await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 1, y: 2, color: 1});
    try {
      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 3, y: 6, color: 1});
      return Promise.reject();
    } catch(e) {
      return Promise.resolve(e);
    }
  });
  it('invalid turn, same user', async () => {
    await connectUsers();
    let game = await createGame();
    await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 1, y: 2, color: 1});
    try {
      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 3, y: 6, color: -1});
      return Promise.reject();
    } catch(e) {
      return Promise.resolve(e);
    }
  });
  it('white user starts', async () => {
    await connectUsers();
    let game = await createGame();
    try {
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 3, y: 6, color: 1});
      return Promise.reject();
    } catch(e) {
      return Promise.resolve(e);
    }
  });
  it('white color starts', async () => {
    await connectUsers();
    let game = await createGame();
    try {
      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 3, y: 6, color: -1});
      return Promise.reject();
    } catch(e) {
      return Promise.resolve(e);
    }
  });
  it('move out of bounds', async () => {
    await connectUsers();
    let game = await createGame();
    try {
      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 3, y: 30, color: 1});
      return Promise.reject();
    } catch(e) {
      return Promise.resolve(e);
    }
  });

  it('move out of bounds. Negative value', async () => {
    await connectUsers();
    let game = await createGame();
    try {
      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: -1, y: 8, color: 1});
      return Promise.reject();
    } catch(e) {
      return Promise.resolve(e);
    }
  });

  it('suicidal move 1', async () => {
    await connectUsers();
    let game = await createGame();
    try {
      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 1, y: 2, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 0, y: 6, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 2, y: 2, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 1, y: 6, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 0, y: 1, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 2, y: 6, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 3, y: 1, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 3, y: 6, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 1, y: 0, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 1, y: 1, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 2, y: 0, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 2, y: 1, color: -1});
      return Promise.reject();
    } catch(e) {
      return Promise.resolve(e);
    }
  });

  it('suicidal move 2', async () => {
    await connectUsers();
    let game = await createGame();
    try {
      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 1, y: 0, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 0, y: 6, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 0, y: 1, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 0, y: 0, color: -1});
      return Promise.reject();
    } catch(e) {
      return Promise.resolve(e);
    }
  });
});

describe('Test functionality', function() {
  this.timeout(15000);
  it('capture stones 1', async () => {
    await connectUsers();
    let game = await createGame();
    try {
      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 1, y: 2, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 0, y: 6, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 2, y: 2, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 1, y: 6, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 0, y: 1, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 2, y: 6, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 3, y: 10, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 3, y: 6, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 1, y: 0, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 1, y: 1, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 2, y: 0, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 2, y: 1, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 3, y: 1, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 2, y: 1, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 1, y: 1, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 6, y: 6, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 2, y: 1, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 7, y: 6, color: -1});
      return Promise.resolve();
    } catch(e) {
      return Promise.reject(e);
    }
  });

  it('capture stones in corner', async () => {
    await connectUsers();
    let game = await createGame();
    try {
      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 18, y: 18, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 17, y: 18, color: -1});

      await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 17, y: 17, color: 1});
      await doMove(SOCKETS_BY_USER_ID[game.white], game, {x: 18, y: 17, color: -1});

      // await doMove(SOCKETS_BY_USER_ID[game.black], game, {x: 17, y: 17, color: 1});
      return Promise.resolve();
    } catch(e) {
      return Promise.reject(e);
    }
  });
});
