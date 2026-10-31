// Build the React client in production mode.
// .env sets NODE_ENV=development for the API server; Vite would otherwise
// inherit it and emit a development bundle (dev-only UI such as the
// "Skip Proctoring" testing button would ship to students).
process.env.NODE_ENV = "production";

const { build } = await import("vite");
await build({ mode: "production" });
