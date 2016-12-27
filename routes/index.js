var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', ensureAuthenticated, function (req, res, next) {
    res.render('index');
});

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated())
        res.redirect('/users/dashboard');
    else
        return next();
}

module.exports = router;
