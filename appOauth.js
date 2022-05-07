require("dotenv").config();
//************BOILERPLATE STARTS***************
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
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
  password: String,
  googleId: String,
  secret: ["mongodb", "arrays"]
});

//*******Setting up the passport plugin and findOrCreate plugin***********
userSchema.plugin(passportLocalMongoose); //must be after the userachema is defined
userSchema.plugin(findOrCreate);

//**********Creating new user model***********
const User = new mongoose.model("User", userSchema);

//*******Setting up the stratigies for the user***********
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
//**********Starting the passsport methods******
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) { //here what is required is the profile and then we find or create the profile
    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return done(err, user);
    });
  }
));

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
    User.find({
      "secret": {
        $ne: null //checking if the secret is not null
      }
    }, function(err, foundUsers) {
      if (!err) {
        if (foundUsers) { //finding users with secrets
          res.render("secrets", {
            usersWithSecrets: foundUsers //sending users who have secrets
          });
        }
      } else {
        console.log(err);
      }
    });
  } else {
    res.redirect("/login");
  }
});

//********Submitting Secrets******
app.get("/submit", function(req, res) {
  if (req.isAuthenticated()) { //checking authentication for the user to submit a secret
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

//*******Auth*********
app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  })
);
app.get("/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets", //if authenticate then we will redirect the app to secrets
    failureRedirect: "/login" //if not authenticate then we will redirect the user to login
  }));
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

//******Posting Secrets********
app.post("/submit", function(req, res) {
  User.findOne({
    _id: req.user._id
  }, function(err, foundUser) {
    if (!err) {
      if (foundUser) { //getting which user is found it will give us the model of the user
        foundUser.secret.push(req.body.secret); //pushing into array using the mongoose methods of the found user
        foundUser.save();
        res.redirect("/secrets");
      } else {
        res.redirect("/login");
      }
    } else {
      res.redirect("/login");
    }
  });
});

//*********App Listening Port***********
app.listen(3000, function() {
  console.log("App running on port 3000");
});