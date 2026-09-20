// Vercel serverless entry point for the whole API.
//
// This project's backend is a normal long-running Express app (server.ts,
// app.listen(...)) — that model works on Render/Railway/Fly.io/a VPS, but
// Vercel doesn't execute a persistent server at all. Without this file,
// Vercel only ran `vite build` and served the static frontend, so every
// /api/* request 404'd and the app silently fell back to its bundled
// placeholder data.
//
// The catch-all filename ([...path]) routes every /api/* request here;
// Vercel passes the original request path through unchanged, which lines
// up with how the Express app already mounts its routes at /api/... — no
// path rewriting needed. Express apps are callable as (req, res), which is
// exactly the handler signature Vercel's Node runtime expects, so it can
// be exported directly.
import { createApp } from '../server/app.js';

const app = createApp();

export default app;
