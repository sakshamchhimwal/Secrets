//************BOILERPLATE STARTS***************
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");
app.use(express.static("public"));

//********Connecting to Database**************
mongoose.connect("mongodb://localhost:27017/secretsDB", {
  useNewUrlParser: true
});

//*********Creating MONGOOSE SCHEMA***********
const userSchema = {
  email: String,
  password: String
};

//**********Creating new user model***********
const User = new mongoose.model("User", userSchema);

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

//*******Logging Out**********
app.get("/logout", function(req, res) {
  res.redirect("/");
});

//***********Registering A user*********
app.post("/register", function(req, res) {
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });
  newUser.save(function(err) {
    if (!err) {
      console.log("Saved");
      res.render("secrets");
    } else {
      console.log(err);
    }
  });
});

//********Logging in a user****************
app.post("/login", function(req, res) {
  User.findOne({
    email: req.body.username
  }, function(err, foundUser) {
    if (!err) {
      if (foundUser.password == req.body.password) {
        res.render("secrets");
      } else {
        res.redirect("/");
        console.log("Wrong Password");
      }
    } else {
      res.redirect("/");
      console.log("No User Found");
    }
  });
});

//*********App Listening Port***********
app.listen(3000, function() {
  console.log("App running on port 3000");
});