// Render compose.html frame-by-frame (pure function of time) via headless Chrome.
//   node render.mjs stills 0.6 2.4 ...   -> stills/t-<time>.png for review
//   node render.mjs video                -> ../brag.mp4 (frames piped straight into ffmpeg)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { launch } from "./cdp.mjs";

const FPS = 30;
const DURATION = 21.0;
const here = new URL("./", import.meta.url);
const html = readFileSync(new URL("compose.html", here), "utf8")
  .replace("BEATS_JSON", readFileSync(new URL("beats.json", here), "utf8"))
  .replace("AVA_JSON", readFileSync(new URL("ava/frames.json", here), "utf8"));
writeFileSync(new URL("compose.built.html", here), html);

const [mode, ...times] = process.argv.slice(2);
const browser = await launch({ width: 1920, height: 1080 });
await browser.goto(new URL("compose.built.html", here).href, 500);
await browser.eval("window.ready");

const frameAt = async (t, format = "jpeg") => {
  // Two animation frames so every canvas/DOM change has been presented before capture
  await browser.eval(`render(${t.toFixed(5)}); new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))`);
  return browser.screenshot(format, format === "jpeg" ? 95 : undefined);
};

if (mode === "stills") {
  mkdirSync(new URL("stills/", here), { recursive: true });
  for (const t of times.map(Number)) {
    writeFileSync(new URL(`stills/t-${t.toFixed(2)}.png`, here), await frameAt(t, "png"));
    console.log("still", t);
  }
} else {
  // Frames go outside OneDrive; existing frames are kept so an interrupted render resumes
  const FRAMES = process.env.BRAG_FRAMES;
  mkdirSync(FRAMES, { recursive: true });
  const total = Math.round(DURATION * FPS);
  const from = Number(times[0] ?? 0), to = Math.min(Number(times[1] ?? total), total);
  const started = Date.now();
  for (let f = from; f < to; f++) {
    const file = `${FRAMES}/f${String(f).padStart(4, "0")}.jpg`;
    if (existsSync(file)) continue;
    writeFileSync(file, await frameAt(f / FPS));
    if (f % 30 === 0) console.log(`frame ${f}/${total} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
  }
  console.log("frames done", from, to);
}
await browser.close();
