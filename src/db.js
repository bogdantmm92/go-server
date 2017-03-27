var Promise = require('promise');
var mongoose = require('mongoose');
mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  connected();
});

function connected() {
  console.log("Connected to db");
}

// Define Schema
var internalDataSchema = mongoose.Schema({
  current_room: String,
  socket_id: String,
});

var userSchema = mongoose.Schema({
  name: String,
  rating: Number,
  internal_data: internalDataSchema,
  created_at: Date,
  updated_at: Date
});

var moveSchema = mongoose.Schema({
  x: Number,
  y: Number,
  color: String,
  created_at: Date,
});
var gameSchema = mongoose.Schema({
  ids: [String],
  accepted_ids: [String],
  moves: [moveSchema],
  black: String,
  white: String,
  current_turn: String,
  created_at: Date,
  updated_at: Date
});

var User = mongoose.model('User', userSchema);
exports.User = User;

var Game = mongoose.model('Game', gameSchema);
exports.Game = Game;

var Move = mongoose.model('Move', moveSchema);
exports.Move = Move;
