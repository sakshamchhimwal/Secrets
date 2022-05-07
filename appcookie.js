require("dotenv").config();
//************BOILERPLATE STARTS***************
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");
app.use(express.static("public"));

//*****Setting up the sessions middleware**********
app.use(session({
  secret: process.env.COOKIE_SECRET,
  resave: false,
  saveUninitialized: false
}));

//*******Setting up the passport Middleware*****
app.use(passport.initialize());
app.use(passport.session());

//********Connecting to Database**************
mongoose.connect("mongodb://localhost:27017/secretsDB", {
  useNewUrlParser: true
});

//*********Creating MONGOOSE SCHEMA***********
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

//*******Setting up the passport plugin***********
userSchema.plugin(passportLocalMongoose); //must be after the userachema is defined

//**********Creating new user model***********
const User = new mongoose.model("User", userSchema);

//*******Setting up the stratigies for the user***********
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//**********Connecting methods****************
//*********Home Route********************
app.get("/", function(req, res) {
  res.render("home");
});

//*********Login Route**********
app.get("/login", function(req, res) {
  res.render("login");
});

//********Register Route********
app.get("/register", function(req, res) {
  res.render("register");
});
//**********Secret Route*********
app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

//*******Logging Out**********
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

//***********Registering A user*********
app.post("/register", function(req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (!err) {
      passport.authenticate("local")(req, res, function() {
        res.redirect("secrets");
      });
    } else {
      console.log(err);
      res.redirect("/register");
    }
  });
});

//********Logging in a user****************
app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if (!err) {
      res.redirect("/secrets");
    } else {
      res.redirect("/login");
      console.log(err);
    }
  });
});

//*********App Listening Port***********
app.listen(3000, function() {
  console.log("App running on port 3000");
});