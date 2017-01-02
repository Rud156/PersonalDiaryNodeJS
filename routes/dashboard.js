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
                docObj[0].content = decrypt(docObj[0].content, res.locals.user.password);
                docObj[0].title = decrypt(docObj[0].title, res.locals.user.password);
                docObj[0].hash = encrypt(docObj[0].hash, res.locals.user.password);

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
    var hash = null;
    var userName = null;
    var encryptHash = null;

    if (!docHash) {
        userName = crypto.createHash('sha256').update(res.locals.user.username).digest("hex");
        hash = crypto.createHash('sha256').update(title + date + res.locals.user.username).digest("hex");
        encryptHash = encrypt(hash, res.locals.user.password);
    }

    userText = encrypt(userText, res.locals.user.password);

    if (!docHash) {
        var userDoc = {
            title: title,
            hash: encryptHash
        };

        title = encrypt(title, res.locals.user.password);

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
        docHash = decrypt(docHash, res.locals.user.password);

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
                    else {
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
    var docHash = decrypt(req.params.id, res.locals.user.password);

    Model.Docs.findOne({ hash: docHash }, function (err, docObj) {
        if (err)
            throw err;
        if (docObj) {

            docObj.content = decrypt(docObj.content, res.locals.user.password);
            docObj.title = decrypt(docObj.title, res.locals.user.password);
            docObj.hash = encrypt(docObj.hash, res.locals.user.password);

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
    docHash = decrypt(docHash, res.locals.user.password);

    Model.Docs.findOneAndRemove({ hash: docHash }, function (err, docObj) {
        if (err)
            throw err;
        if (!docObj) {
            req.flash('errorMsg', "Page does not exist");
            res.redirect('/users/dashboard');
        }
        else {
            docHash = encrypt(docHash, res.locals.user.password);
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
    docHash = decrypt(docHash, res.locals.user.password);

    Model.Docs.findOne({ hash: docHash }, function (err, docObject) {
        if (err)
            throw err;
        if (!docObject) {
            req.flash('errorMsg', "Page does not exist");
            res.redirect('/users/dashboard');
        }
        else {
            docObject.content = decrypt(docObject.content, res.locals.user.password);
            docObject.title = decrypt(docObject.title, res.locals.user.password);
            docHash = encrypt(docHash, res.locals.user.password);

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

function encrypt(dataToEncrypt, key) {
    var cipher = crypto.createCipher('aes-256-ctr', key);
    var resultData = cipher.update(dataToEncrypt, 'utf8', 'hex');
    resultData += cipher.final('hex');
    return resultData;
}

function decrypt(dataToDecrypt, key) {
    var deCipher = crypto.createDecipher('aes-256-ctr', key);
    var resultData = deCipher.update(dataToDecrypt, 'hex', 'utf8');
    resultData += deCipher.final('utf8');
    return resultData;
}

module.exports = router;
