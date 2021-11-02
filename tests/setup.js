// overwrite default timeout. Jest timesout async requests at 5000ms by default;
jest.setTimeout(30000);

// Set up mongo stuff for Jest
// Because Jest executes test files in test folders only, by default it does not have access to any
// mongo connections and models which are defined outside the test folder (in index.js)
// By doing this Jest can now fully utilize mongo connections and models
require('../models/User');

const mongoose = require('mongoose');

const keys = require('../config/keys');

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, { useMongoClient: true });