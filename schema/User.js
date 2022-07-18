var mongoose = require("mongoose");

var User = new mongoose.Schema({
  username: String,
  password: String,
  date: { type: Date, default: new Date() },
  avatar_path: String,
});

module.exports = mongoose.model("User", User);
