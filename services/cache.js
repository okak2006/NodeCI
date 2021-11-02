const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util'); // util to promisify redis get function so we can just use async await instead of callback
const keys = requrie('../config/keys');
//const redisURL = 'redis://127.0.0.1:6379';
const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

/** 
 * Patch exec function to allow caching.
 * Mongoose queries use exec function inherited by prototype chaining to execute queries
 * We will add code to this to change the default behavior
 * */ 

const exec = mongoose.Query.prototype.exec;

// Add flexible caching function. to make use of caching, provide options object as top level hash key
mongoose.Query.prototype.cache = function (options = {}) {
    // this = query instance. Same query instance as below (mongoose.Query.pototype) so we can reference in below function
    this.useCache = true;
    // hash has to be number or key because we are using redis (TS consideration)
    this.hashKey = JSON.stringify(options.key || '')
    // still have to return this so we can retain original functions (i.e. methods chaining after .cache() function)
    return this;
}

mongoose.Query.prototype.exec = async function() {
     // if caching is called return original query execution
    if (!this.useCache) {
        return exec.apply(this, arguments)
    }

    // generate unique cache keys
    // getQuery returns query params as objects on current query and mongooseCollection.name gives us name of collection
    // Redis can only store strings or numbers so we need to Stringify
    const key = JSON.stringify(Object.assign({},  this.getQuery(), { collection: this.mongooseCollection.name }));

    // check if we have key in redis. hget because we are using nested hash
    // IMPORTANT: how we set and clear cache is entirely dependent on your project's use case so design with caution
    const cacheValue = await client.hget(this.hashKey, key);

    // If we do return that. However, Redis returns a JSON object. 
    // We need to ensure this is consistent with what nomral exec function returns which is a Mongoose document (or Model instances)
    // Hydrate model to achieve this
    if(cacheValue) {
        // cacheValue can have one object or arr of objects so hydrate model approprriately
        const doc = JSON.parse(cacheValue);
        return Array.isArray(doc) ?
            doc.map(d => new this.model(d)) :
            new this.model(doc)
    }

    // Otherwise, issue the query and store the result in redis while setting expiration
    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);
    return result;
}

module.exports = {
    // exporting function that allows clearing nested hashes
    // we want to do this when a user creates a new blog post
    // because we want to clear redis cache and update it with the latest values
    // you can just require('clearHash') from this file elsewhere -> for this project it's in the cleanCache middleware
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    },
}