var express = require('express');
var router = express.Router();

var crypto = require('crypto');
var Model = require('../Models/models');

/* GET home page. */
router.get('/dashboard', ensureAuthenticated, function (req, res, next) {
    var documents = res.locals.user.documents;
    if (documents.length !== 0) {
        var userName = crypto.createHash('sha256').update(res.locals.user.username).digest("hex");

        Model.Docs.find({ username: userName }, function (err, docObj) {
            if (err)
                throw err;
            if (!docObj) {
                req.flash('errorMsg', 'Page does not exist');
                res.redirect('/users/dashboard');
            }
            else {
                var decipher = crypto.createDecipher('aes-256-ctr', res.locals.user.password);
                var dec = decipher.update(docObj[0].content, 'hex', 'utf8');
                dec += decipher.final('utf8');
                docObj[0].content = dec;
                res.render('dashboard', { docObj: docObj[0] });
            }
        }).sort({ "date": -1 }).limit(1);
    }
    else
        res.render('dashboard', { noObject: true });
});

router.post('/save', ensureAuthenticated, function (req, res, next) {
    var title = req.body.title;
    var date = req.body.date;
    var docHash = req.body.docHash;
    var userText = req.body.userText;

    if (!docHash) {
        var userName = crypto.createHash('sha256').update(res.locals.user.username).digest("hex");
        var hash = crypto.createHash('sha256').update(title + date + res.locals.user.username).digest("hex");
    }

    var cipher = crypto.createCipher('aes-256-ctr', res.locals.user.password);
    userText = cipher.update(userText, 'utf8', 'hex');
    userText += cipher.final('hex');

    if (!docHash) {
        var userDoc = {
            title: title,
            hash: hash
        };
        var dataSet = new Model.Docs({
            date: date,
            title: title,
            username: userName,
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
                Model.User.findOneAndUpdate({ username: res.locals.user.username }, { $push: { documents: userDoc } }, function (err, userObj) {
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
    }
    else {
        Model.Docs.findOne({ hash: docHash }, function (err, docObj) {
            if (err)
                throw err;
            if (!docObj) {
                req.flash('errorMsg', 'Page does not exist');
                res.redirect('/users/dashboard');
            }
            else {
                docObj.content = userText;
                docObj.save(function (err, docObject) {
                    if (err)
                        throw err;
                    if (!docObject) {
                        req.flash('errorMsg', 'Page does not exist');
                        res.redirect('/users/dashboard');
                    }
                    else{
                        req.flash('successMsg', 'Page updated');
                        res.redirect('/users/dashboard');
                    }
                });
            }
        });
    }
});

router.get('/editor', ensureAuthenticated, function (req, res, next) {
    //console.log("Activating the editor");
    res.render('dashboard', { editor: true, content: null });
});

router.route('/:id').get(ensureAuthenticated, function (req, res) {
    Model.Docs.findOne({ hash: req.params.id }, function (err, docObj) {
        if (err)
            throw err;
        if (docObj) {

            var decipher = crypto.createDecipher('aes-256-ctr', res.locals.user.password);
            var dec = decipher.update(docObj.content, 'hex', 'utf8');
            dec += decipher.final('utf8');
            docObj.content = dec;

            res.render('dashboard', { docObj: docObj });
        }
        else {
            req.flash('errorMsg', 'Page does not exist');
            res.redirect('/users/dashboard');
        }
    });
});

router.post('/delete', ensureAuthenticated, function (req, res, next) {
    var docHash = req.body.docHash;
    Model.Docs.findOneAndRemove({ hash: docHash }, function (err, docObj) {
        if (err)
            throw err;
        if (!docObj) {
            req.flash('errorMsg', "Page does not exist");
            res.redirect('/users/dashboard');
        }
        else {
            Model.User.findOneAndUpdate({ username: res.locals.user.username }, { $pull: { documents: { hash: docHash } } }, function (err, userObj) {
                if (err)
                    throw err;
                if (!userObj) {
                    req.flash('errorMsg', "Page does not exist");
                    res.redirect('/users/dashboard');
                }
                else {
                    req.flash('successMsg', "Page Deleted Successfully");
                    res.redirect('/users/dashboard');
                }
            });
        }
    });
});

router.post('/modify', ensureAuthenticated, function (req, res, next) {
    var docHash = req.body.docHash;
    Model.Docs.findOne({ hash: docHash }, function (err, docObject) {
        if (err)
            throw err;
        if (!docObject) {
            req.flash('errorMsg', "Page does not exist");
            res.redirect('/users/dashboard');
        }
        else {

            var decipher = crypto.createDecipher('aes-256-ctr', res.locals.user.password);
            var dec = decipher.update(docObject.content, 'hex', 'utf8');
            dec += decipher.final('utf8');
            docObject.content = dec;

            res.render('dashboard', {
                editor: true,
                content: docObject.content,
                title: docObject.title,
                date: docObject.date,
                docHash: docHash
            });
        }
    });
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();
    else {
        req.flash('errorMsg', "Not Logged In");
        res.redirect('/auth/login');
    }
}

module.exports = router;
