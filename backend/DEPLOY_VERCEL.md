# Deploying to Vercel

This backend has been adapted to run as a Vercel serverless function
while still working as a normal Node server locally. What changed:

- **`api/index.js`** — new entry point. Vercel builds every file under
  `/api` as its own serverless function; this one just re-exports the
  existing Express `app` from `src/server.js`.
- **`vercel.json`** — rewrites every incoming request to `api/index.js`,
  so all your existing routes (`/api/auth`, `/api/leads`, etc.) keep
  working unchanged.
- **`src/config/db.js`** — now caches the Mongoose connection on
  `global`, so a warm serverless invocation reuses the existing
  connection instead of opening a new one on every request (Mongo has
  a connection limit, and serverless containers get invoked a lot).
- **`src/server.js`** — connects to the DB via middleware on every
  request (cheap when cached) instead of once at boot, and only calls
  `app.listen(...)` when the file is run directly (`node
  src/server.js`), not when it's imported by `api/index.js`. Local
  `npm run dev` / `npm start` behave exactly as before.

Nothing in your routes, controllers, or models needed to change.

## Steps

1. **Push this project to a Git repo** (GitHub/GitLab/Bitbucket), or
   deploy directly from the CLI (`npx vercel`) from this folder.

2. **Import the project in Vercel** (vercel.com → Add New → Project),
   or run `npx vercel` in this directory and follow the prompts.

3. **Set environment variables** in the Vercel project settings
   (Settings → Environment Variables) — same names as `.env.example`:
   - `MONGO_URI` — your MongoDB Atlas connection string (a local
     `mongodb://127.0.0.1` URI won't work on Vercel; use Atlas or
     another hosted MongoDB)
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `JWT_ACCESS_EXPIRES`
   - `JWT_REFRESH_EXPIRES`
   - `CLIENT_URL` — your frontend's URL (for CORS)
   - `NODE_ENV=production`

   (`PORT` is not needed on Vercel — it manages the port itself.)

4. **Deploy** — `npx vercel --prod`, or push to the branch Vercel is
   tracking.

5. **Test it**: `https://<your-project>.vercel.app/api/health` should
   return the health-check JSON.

## Notes / things worth knowing

- **Cold starts**: the first request to a cold function will pay the
  cost of a fresh MongoDB connection (a few hundred ms). Subsequent
  requests to the same warm instance reuse it.
- **MongoDB Atlas network access**: allow access from `0.0.0.0/0` (or
  Vercel's IP ranges) in Atlas, since serverless functions don't have
  fixed outbound IPs on the default Vercel plan.
- **File uploads**: `propertyController.js` currently accepts media as
  URLs only (no `multer` disk storage is wired up), which is good —
  Vercel's filesystem is read-only/ephemeral, so any real upload
  feature should go straight to S3/Cloudinary/etc. rather than local
  disk.
- **Function timeout**: Vercel's default serverless function timeout
  is short on the Hobby plan (10s) and longer on Pro (up to 60s/900s
  depending on plan). Long-running report/aggregation endpoints should
  be checked against that if you're on the free tier.
