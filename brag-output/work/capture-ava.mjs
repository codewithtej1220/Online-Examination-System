// Capture the real 3D Ava mascot (waving) as a transparent PNG sequence with timestamps.
import { mkdirSync, writeFileSync } from "node:fs";
import { launch } from "./cdp.mjs";

const OUT = new URL("./ava/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const browser = await launch({ width: 1600, height: 1000 });
await browser.send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 3, mobile: false });
await browser.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
await browser.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });

await browser.goto("http://localhost:5000/app/", 800);
await browser.eval("localStorage.clear(); sessionStorage.clear(); true");
await browser.goto("http://localhost:5000/app/", 5000);

// Show only the mascot canvas
const rect = await browser.eval(`(() => {
  const style = document.createElement("style");
  style.textContent = "html, body { background: transparent !important; } body * { visibility: hidden !important; } canvas { visibility: visible !important; }";
  document.head.appendChild(style);
  const r = document.querySelector("canvas").getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
})()`);
console.log("canvas", rect);
await browser.sleep(500);

const frames = [];
const start = Date.now();
for (let i = 0; Date.now() - start < 3200; i++) {
  const t = (Date.now() - start) / 1000;
  const { data } = await browser.send("Page.captureScreenshot", { format: "png", clip: { ...rect, scale: 1 }, captureBeyondViewport: false });
  const name = `ava-${String(i).padStart(3, "0")}.png`;
  writeFileSync(new URL(name, OUT), Buffer.from(data, "base64"));
  frames.push({ name, t });
}
writeFileSync(new URL("frames.json", OUT), JSON.stringify({ size: { width: rect.width * 3, height: rect.height * 3 }, frames }, null, 1));
console.log("frames", frames.length);
await browser.close();
