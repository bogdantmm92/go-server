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
  lastLoggedIn: Number
});

var User = mongoose.model('User', userSchema);
exports.User = User;
