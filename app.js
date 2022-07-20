var http = require("http");
var express = require("express");
var path = require("path");
var mongoose = require("mongoose");
var fileUpload = require("express-fileupload");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var session = require("express-session");
var helmet = require("helmet");
var csrf = require("csurf");
var moment = require("moment-timezone");

var logger = require("./lib/logger");
var errorLogger = require("./lib/error_logger");

var Message = require("./schema/Message");
var User = require("./schema/User");

var app = express();

mongoose.connect("mongodb://localhost:27017/chat", function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log("Successfully connected to MongoDB.");
  }
});

moment.tz.setDefault("Asia/Tokyo");

app.use(helmet());

app.use(session({ secret: "HogeFuga" }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use("/image", express.static(path.join(__dirname, "image")));
app.use("/avatar", express.static(path.join(__dirname, "avatar")));
app.use("/css", express.static(path.join(__dirname, "css")));

app.get("/", function (req, res) {
  Message.find({}, function (err, msgs) {
    if (err) throw err;
    return res.render("index", {
      messages: msgs,
      user: req.session && req.session.user ? req.session.user : null,
      moment: moment,
    });
  });
});

app.get("/signup", function (req, res, next) {
  return res.render("signup");
});

app.post("/signup", fileUpload(), function (req, res, next) {
  var avatar = req.files.avatar;
  avatar.mv("./avatar/" + avatar.name, function (err) {
    if (err) throw err;
    var newUser = new User({
      username: req.body.username,
      password: req.body.password,
      avatar_path: "/avatar/" + avatar.name,
    });
    newUser.save((err) => {
      if (err) throw err;
      req.session.user = {
        username: newUser.username,
        avatar_path: newUser.avatar_path,
      };
      return res.redirect("/");
    });
  });
});

app.get("/login", function (req, res, next) {
  return res.render("login");
});

app.post("/login", passport.authenticate("local"), function (req, res, next) {
  User.findOne({ _id: req.session.passport.user }, function (err, user) {
    if (err || !user || !req.session) {
      return res.redirect("/login");
    } else {
      req.session.user = {
        username: user.username,
        avatar_path: user.avatar_path,
      };
      return res.redirect("/");
    }
  });
});

app.get("/logout", function (req, res, next) {
  delete req.session.user;
  return res.redirect("/");
});

passport.use(
  new LocalStrategy(function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) return done(err);
      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }
      if (user.password !== password) {
        return done(null, false, { message: "Incorrect password." });
      }
      return done(null, user);
    });
  })
);

passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  User.findOne({ _id: id }, function (err, user) {
    done(err, user);
  });
});

var csrfProtection = csrf();

app.get("/update", checkAuth, csrfProtection, function (req, res, next) {
  return res.render("update", {
    user: req.session && req.session.user ? req.session.user : null,
    csrf: req.csrfToken(),
  });
});

app.post(
  "/update",
  checkAuth,
  fileUpload(),
  csrfProtection,
  function (req, res, next) {
    if (req.files && req.files.image) {
      req.files.image.mv("./image/" + req.files.image.name, function (err) {
        if (err) throw err;
        var newMessage = new Message({
          username: req.body.username,
          message: req.body.message,
          avatar_path: req.body.avatar_path,
          image_path: "/image/" + req.files.image.name,
        });
        newMessage.save((err) => {
          if (err) throw err;
          return res.redirect("/");
        });
      });
    } else {
      var newMessage = new Message({
        username: req.body.username,
        message: req.body.message,
        avatar_path: req.body.avatar_path,
      });
      newMessage.save((err) => {
        if (err) throw err;
        return res.redirect("/");
      });
    }
  }
);

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.redirect("/login");
  }
}

app.use(function (req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  return res.render("error", {
    status: err.status,
  });
});

app.use(function (err, req, res, next) {
  errorLogger.error(err);
  if (err.code === "EBADCSRFTOKEN") {
    res.status(403);
  } else {
    res.status(err.status || 500);
  }

  return res.render("error", {
    message: err.message,
    status: err.status || 500,
  });
});

var server = http.createServer(app);
server.listen(3000);
