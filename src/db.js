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

/* moveSchema.color
white = -1
black = 1
*/
var moveSchema = mongoose.Schema({
  x: Number,
  y: Number,
  captured: Boolean,
  color: Number,
  created_at: Date,
});
var gameSchema = mongoose.Schema({
  ids: [String],
  accepted_ids: [String],
  moves: [moveSchema],
  board_size: Number,
  black: String,
  white: String,
  current_turn: Number,
  created_at: Date,
  updated_at: Date
});

var User = mongoose.model('User', userSchema);
exports.User = User;

var Game = mongoose.model('Game', gameSchema);
exports.Game = Game;

var Move = mongoose.model('Move', moveSchema);
exports.Move = Move;
