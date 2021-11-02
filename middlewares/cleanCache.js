const { clearHash } = requrie('../services/cache');

module.exports = async (req, res, next) => {
    // let req and res (the route handlers) to run first
    // because we only want to clear cache when there is no error creating the new blog post
    await next();
    clearHash(req.user.id);
}