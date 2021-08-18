// All required imports from the dependency packages in the package.json file
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const path = require('path');
const favicon = require("serve-favicon");


// Declares to use a variable port via .env or port 3000
const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

// Initializes passport and session
app.use(passport.initialize(undefined));
app.use(passport.session(undefined));

// This string connects to the MongoDB Database
mongoose.connect(process.env.DB_HOST, {useNewUrlParser: true, useUnifiedTopology: true}).then(r => console.log("Successfully connected to Database."));
mongoose.set("useCreateIndex", true);

// Basic Schema for a User
const userSchema = new mongoose.Schema({
    fName: String,
    lName: String,
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// Passport.serialize and passport.deserialize are used to set id as a cookie in the user's browser
// and to get the id from the cookie when it then used to get user info in a callback.
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// Get Routes **************************************************************

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        let fName = req.user.fName;
        let lName = req.user.lName;
        res.render("secrets", {fName: fName, lName: lName});
    } else {
        res.redirect("/");
    }
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

// POST Routes***********************************************************************

// Registers a New User and once there are no errors, the user is added to the database
// and redirected to the secrets page
app.post("/register", (req, res) => {
    User.register({username: req.body.username, fName: req.body.fName, lName: req.body.lName}, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

// Logs in a user only if they have been Registered and Authenticated
app.post("/home", (req, res) => {
    const user = new User({
        fName: req.body.fName,
        lName: req.body.lName,
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, (err) =>{
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

// Listens and indicates on what port server was started on
app.listen(PORT, () => {
    console.log("The server was started on port " + PORT);
});




