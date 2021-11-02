const mongoose = require('mongoose');
const User = mongoose.model('User');

module.exports = () => {
    // depending on your app requirements, you want to pass in randomized params to User model
    return new User({}).save();
}