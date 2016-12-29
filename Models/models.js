var mongoose = require('mongoose');
var bCrypt = require('bcryptjs');

mongoose.Promise = global.Promise;

var userSchema = mongoose.Schema({
    username: {
        type: String,
        index: true
    },
    password: {
        type: String
    },
    documents: [{
        title: String,
        date: String,
        hash: String
    }]
});

var documentSchema = mongoose.Schema({
    date: String,
    title: String,
    hash: {
        type: String,
        index: true
    },
    content: String
});

var User = mongoose.model('User', userSchema);
module.exports = {
    User: User,
    Docs: mongoose.model('Document', documentSchema)
};

// Torch
// CheckBook
// Aadhar Card
// Voter Card Xerox

module.exports.createUser = function(newUser, callback){
    bCrypt.genSalt(10, function(err, salt){
        bCrypt.hash(newUser.password, salt, function(err, hash){
            newUser.password = hash;
            newUser.save(callback);
        });
    });
};

module.exports.comparePassword = function(password, hash, callback){
    bCrypt.compare(password, hash, function(err, isMatch){
        if(err)
            throw err;
        callback(null, isMatch);
    });
};