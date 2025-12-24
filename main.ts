import { Hono } from "hono";
import { serveStatic } from "hono/deno";

const app = new Hono();
const distRoot = new URL("./dist/", import.meta.url).pathname;
const assetsRoot = new URL("./dist/assets/", import.meta.url).pathname;

// 1) Serve anything in /assets/**
app.use("/assets/*", serveStatic({ root: assetsRoot }));

// 2) Catch *all* other files in dist (CSS, JS, images, etc.)
app.use("/*", serveStatic({ root: distRoot }));

// 3) Fallback to index.html for the SPA
app.get("*", serveStatic({ path: `${distRoot}/index.html` }));

Deno.serve(app.fetch);
