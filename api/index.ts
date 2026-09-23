// Vercel serverless entry point for the whole API.
//
// This project's backend is a normal long-running Express app (server.ts,
// app.listen(...)) — that model works on Render/Railway/Fly.io/a VPS, but
// Vercel doesn't execute a persistent server at all. Without this file,
// Vercel only ran `vite build` and served the static frontend, so every
// /api/* request 404'd and the app silently fell back to its bundled
// placeholder data.
//
// A bracket catch-all filename (api/[...path].ts) was tried first, but in
// this project it only ever matched 0-1 path segments after /api/ (e.g.
// /api/health worked, /api/v1/discover/trending 404'd at Vercel's edge
// before ever reaching this function) — so instead this is a single named
// function, and vercel.json explicitly rewrites every /api/* request here.
// Vercel rewrites don't change what the target function sees as the
// request path, so Express still sees the original /api/v1/... path and
// routes it normally — no path rewriting needed on this end. Express apps
// are callable as (req, res), which is exactly the handler signature
// Vercel's Node runtime expects, so it can be exported directly.
import { createApp } from '../server/app.js';

const app = createApp();

export default app;
