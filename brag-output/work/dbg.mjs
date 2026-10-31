import { launch } from "./cdp.mjs";
const b = await launch({ width: 1920, height: 1080 });
await b.goto(new URL("compose.built.html", import.meta.url).href, 500);
await b.eval("window.ready");
for (const t of [4.9, 7.2]) {
  console.log(t, await b.eval(`(() => { render(${t}); const el = document.elementFromPoint(960, 540); const w = document.getElementById("wipe").getContext("2d").getImageData(960, 540, 1, 1).data; const g = document.getElementById("bg").getContext("2d").getImageData(960, 300, 1, 1).data; return { top: el.id || el.className || el.tagName, wipe: [...w], bg: [...g], scenes: [...document.querySelectorAll(".scene")].map(s => s.id + ":" + s.style.display).join(" ") }; })()`));
}
await b.close();
