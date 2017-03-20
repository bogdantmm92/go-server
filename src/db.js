var mongoose = require('mongoose');
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
var userSchema = mongoose.Schema({
  name: String,
  rating: Number,
  lastLoggedIn: Date
});

var moveSchema = mongoose.Schema({
  x: Number,
  y: Number,
  time: Date
});
var gameSchema = mongoose.Schema({
  combinedId: String,
  moves: [moveSchema]
});

var User = mongoose.model('User', userSchema);
exports.User = User;
