// Vercel serverless entry point.
// Vercel treats every file in /api as its own serverless function; we
// export the single Express app here and let vercel.json rewrite all
// incoming requests to this one function, so the whole API runs as one
// serverless function while keeping all existing route files untouched.
module.exports = require("../src/server");
