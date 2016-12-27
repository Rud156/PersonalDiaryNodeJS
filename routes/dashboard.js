var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/dashboard', ensureAuthenticated, function (req, res, next) {
    res.render('dashboard', { title: 'Express' });
});

function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated())
        return next();
    else{
        req.flash('errorMsg', "Not Logged In");
        res.redirect('/auth/login');
    }
}

module.exports = router;
