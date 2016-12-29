var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var Model = require('../Models/models');

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
    var hash = crypto.createHash('sha256').update(title + date + req.user.username).digest("hex");
    var userText = req.body.userText;

    var userDoc = {
        date: date,
        title: title,
        hash: hash
    };
    var dataSet = new Model.Docs({
        date: date,
        title: title,
        hash: hash,
        content: userText
    });
    Model.Docs.findOne({ hash: hash }, function (err, docObject) {
        if (err)
            throw err;

        if (docObject) {
            req.flash('errorMsg', 'Page with same title and date already exists');
            res.redirect('/users/dashboard');
        }
        else {
            Model.User.findOneAndUpdate({ username: req.user.username }, { $push: { documents: userDoc } }, function (err, userObj) {
                if (err)
                    throw err;
            });
            dataSet.save(function (err, docObject) {
                if (err)
                    throw err;
            });
            req.flash('successMsg', 'Page saved');
            res.redirect('/users/dashboard');
        }
    });
});

router.route('/:id').get(function (req, res) {
    Model.Docs.findOne({hash: req.params.id}, function(err, docObj){
        if(err)
            throw err;
    });
});

module.exports = router;
