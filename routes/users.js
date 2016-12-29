var express = require('express');
var router = express.Router();

var passport = require('passport');
var localStrategy = require('passport-local').Strategy;

var Model = require('../Models/models');

/* GET users listing. */
router.get('/login', function (req, res, next) {
    res.render('login');
});

router.get('/register', function (req, res, next) {
    res.render('register');
});

router.post('/register', function (req, res) {
    var userName = req.body.username;
    var password = req.body.password;
    userName = userName.toLowerCase();

    Model.User.findOne({ username: userName }, function (err, userObj) {
        if(err)
            throw err;
        if (userObj) {
            req.flash('errorMsg', 'User is already registered');
            res.redirect('/auth/register');
        }
        else {
            var newUser = new Model.User({
                username: userName,
                password: password,
                documents: []
            });

            Model.createUser(newUser, function (err, user) {
                if (err)
                    throw err;
                console.log(user);
            });

            req.flash('successMsg', 'You are now registered and can login');
            res.redirect('/auth/login');
        }
    });
});

passport.use(new localStrategy(
    function (username, password, done) {
        username = username.toLowerCase();
        Model.User.findOne({ username: username }, function (err, userObj) {
            if (err)
                throw err;
            if (!userObj)
                return done(null, false, { message: "Username or password incorrect" });

            Model.comparePassword(password, userObj.password, function (err, isMatch) {
                if (err)
                    throw err;
                if (!isMatch)
                    return done(null, false, { message: "Username or password incorrect" });
                else
                    return done(null, userObj);
            });
        });
    }
));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    Model.User.findById(id, function (err, userObj) {
        done(err, userObj);
    });
});

router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/users/dashboard',
        failureRedirect: '/auth/login',
        failureFlash: true
    }),
    function (req, res) {
        res.redirect('/');
    }
);

router.get('/logout', function (req, res) {
    req.logout();
    req.flash('successMsg', 'Successfully logged out');
    res.redirect('/auth/login');
});

module.exports = router;
