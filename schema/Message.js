var mongoose = require("mongoose");

var Message = new mongoose.Schema({
  username: String,
  message: String,
  avatar_path: String,
  date: { type: Date, default: new Date() },
  image_path: String,
});

module.exports = mongoose.model("Message", Message);
