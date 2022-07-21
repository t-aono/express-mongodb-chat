import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import moment from "moment-timezone";
import helmet from "helmet";
import fileUpload, { UploadedFile } from "express-fileupload";
import csrf from "csurf";

import { default as Message } from "./schema/Message";
import { default as User, UserFields } from "./schema/User";

const passport = require("passport");
const session = require("express-session");
const http = require("http");
const path = require("path");
const LocalStrategy = require("passport-local").Strategy;
const logger = require("./lib/logger");
const errorLogger = require("./lib/error_logger");

const app: Express = express();

mongoose.connect("mongodb://localhost:27017/chat", (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Successfully connected to MongoDB.");
  }
});

moment.tz.setDefault("Asia/Tokyo");

app.use(helmet());

declare module "express-session" {
  interface SessionData {
    user: UserFields;
    passport: { user: UserFields } | undefined;
  }
}
app.use(session({ secret: "HogeFuga" }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use("/image", express.static(path.join(__dirname, "image")));
app.use("/avatar", express.static(path.join(__dirname, "avatar")));
app.use("/css", express.static(path.join(__dirname, "css")));

app.get("/", (req, res) => {
  Message.find({}, (err: Error, msgs: string) => {
    if (err) throw err;
    return res.render("index", {
      messages: msgs,
      user: req.session && req.session.user ? req.session.user : null,
      moment: moment,
    });
  });
});

app.get("/signup", (req, res, next) => {
  return res.render("signup");
});

app.post("/signup", fileUpload(), (req, res, next) => {
  if (!req.files) return res.redirect("/signup");
  const avatar = req.files.avatar as UploadedFile;
  avatar.mv("./avatar/" + avatar.name, (err: Error) => {
    if (err) throw err;
    const newUser = new User({
      username: req.body.username,
      password: req.body.password,
      avatar_path: "/avatar/" + avatar.name,
    });
    newUser.save((err: any) => {
      if (err) throw err;
      req.session.user = {
        username: newUser.username,
        avatar_path: newUser.avatar_path,
      };
      return res.redirect("/");
    });
  });
});

app.get("/login", (req, res, next) => {
  return res.render("login");
});

app.post("/login", passport.authenticate("local"), (req, res, next) => {
  User.findOne(
    { _id: req.session.passport!.user },
    (err: Error, user: UserFields) => {
      if (err || !user || !req.session) {
        return res.redirect("/login");
      } else {
        req.session.user = {
          username: user.username,
          avatar_path: user.avatar_path,
        };
        return res.redirect("/");
      }
    }
  );
});

app.get("/logout", (req, res, next) => {
  delete req.session.user;
  return res.redirect("/");
});

passport.use(
  new LocalStrategy((username: string, password: string, done: any) => {
    User.findOne({ username: username }, (err: Error, user: UserFields) => {
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

passport.serializeUser(
  (user: { _id: string }, done: (_: null, _id: string) => void) => {
    done(null, user._id);
  }
);

passport.deserializeUser(
  (id: string, done: (err: Error, user: UserFields) => void) => {
    User.findOne({ _id: id }, (err: Error, user: UserFields) => {
      done(err, user);
    });
  }
);

const csrfProtection = csrf();

app.get("/update", checkAuth, csrfProtection, (req, res, next) => {
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
  (req, res, next) => {
    if (req.files && req.files.image) {
      const image = req.files.image as UploadedFile;
      image.mv("./image/" + image.name, (err) => {
        if (err) throw err;
        const newMessage = new Message({
          username: req.body.username,
          message: req.body.message,
          avatar_path: req.body.avatar_path,
          image_path: "/image/" + image.name,
        });
        newMessage.save((err) => {
          if (err) throw err;
          return res.redirect("/");
        });
      });
    } else {
      const newMessage = new Message({
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

function checkAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    return res.redirect("/login");
  }
}

app.use((req, res, next) => {
  const err: any = new Error("Not Found");
  err.status = 404;
  return res.render("error", {
    status: err.status,
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
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
