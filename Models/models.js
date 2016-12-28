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
        date: String
    }]
});

var documentSchema = mongoose.Schema({
    date: String,
    title: String,
    hash: String,
    content: String
});

var User = module.exports = mongoose.model('User', userSchema);

module.exports.createUser = function(newUser, callback){
    bCrypt.genSalt(10, function(err, salt){
        bCrypt.hash(newUser.password, salt, function(err, hash){
            newUser.password = hash;
            newUser.save(callback);
        });
    });
};

module.exports.getUserbyId = function(Id, callback){
    User.findById(Id, callback);
};

module.exports.comparePassword = function(password, hash, callback){
    bCrypt.compare(password, hash, function(err, isMatch){
        if(err)
            throw err;
        callback(null, isMatch);
    });
};