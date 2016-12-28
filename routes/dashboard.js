var express = require('express');
var router = express.Router();

var Users = require('../Models/models');

/* GET home page. */
router.get('/dashboard', ensureAuthenticated, function (req, res, next) {
    res.render('dashboard');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else {
        req.flash('errorMsg', "Not Logged In");
        res.redirect('/auth/login');
    }
}

router.post('/save', function (req, res, next) {
    var title = req.body.title;
    var date = req.body.date;
    var userText = req.body.userText;

    console.log("Title: " + title + ", Date: " + date + ", Text: " + userText);
    var document = {
        date: date,
        title: title,
        content: userText
    };
    Users.findOneAndUpdate({username: req.user.username}, {$push: {documents: document}}, function(err, userObj){
        if(err)
            throw err;
        req.user = userObj;
    });
    res.redirect('/users/dashboard');
});

module.exports = router;
