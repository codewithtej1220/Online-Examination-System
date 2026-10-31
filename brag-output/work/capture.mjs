// Capture the real OES Pro UI at each story beat (entry -> key action -> result).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { launch } from "./cdp.mjs";

const BASE = "http://localhost:5000/app/";
const OUT = new URL("./shots/", import.meta.url);
mkdirSync(OUT, { recursive: true });
// Demo accounts share the password from the project's own seed script
const PASSWORD = readFileSync(new URL("../../scripts/seed.js", import.meta.url), "utf8").match(/const password = "([^"]+)"/)[1];

const browser = await launch({
  width: 1600,
  height: 1000,
  extraArgs: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"]
});

await browser.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });

const shot = async (name, settle = 900) => {
  await browser.sleep(settle);
  writeFileSync(new URL(`${name}.png`, OUT), await browser.screenshot("png"));
  console.log("captured", name);
};

// Page helpers: click the first visible element whose text matches, type into inputs
const helpers = `
  window.__click = (text, selector = "button") => {
    const matches = [...document.querySelectorAll(selector)].filter((n) => n.textContent.trim().includes(text) && !n.disabled);
    // Buttons: first match. Other selectors: innermost (last) match, so a card is clicked rather than the page root
    const el = selector === "button" ? matches[0] : matches[matches.length - 1];
    if (!el) throw new Error("No element with text: " + text);
    el.scrollIntoView({ block: "center" });
    el.click();
    return true;
  };
  window.__set = (el, value) => {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  true;
`;

async function loginAs(username) {
  const response = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: PASSWORD })
  });
  const { data } = await response.json();
  await browser.goto(BASE, 800);
  await browser.eval(`localStorage.clear();
    sessionStorage.setItem("ava-greeted", "1");
    localStorage.setItem("oesToken", ${JSON.stringify(data.token)});
    localStorage.setItem("oesUser", ${JSON.stringify(JSON.stringify(data.user))});
    true`);
  await browser.goto(BASE, 2500);
  await browser.eval(helpers);
}

const step = async (js, wait = 1200) => {
  await browser.eval(`(async () => { ${js} })()`);
  await browser.sleep(wait);
};

// 1. Login page with Ava waving
await browser.goto(BASE, 800);
await browser.eval("localStorage.clear(); sessionStorage.clear(); true");
await browser.goto(BASE, 4500);
await shot("01-login");

// 2. Faculty: generate a test from notes
await loginAs("demo_faculty");
await step(`__click("Test Generator")`, 1500);
await step(`__click("Use sample DBMS notes")`, 400);
await step(`__click("Generate questions")`, 2500);
await step(`window.scrollTo(0, 0)`, 300);
await shot("02-generator", 1500);
await step(`window.scrollTo(0, 260)`, 300);
await shot("03-generator-preview", 1200);

// Auto test builder
await step(`window.scrollTo(0, 0); __click("Assemble a full exam", ".tilt-card")`, 1500);
await step(`
  const title = document.querySelector('input[placeholder^="Test title"]');
  __set(title, "DBMS Unit 2 Quiz");
`, 400);
await shot("04-builder", 1200);

// 3. Student: exams -> proctored exam -> result -> Ava review
await loginAs("demo_student");
await shot("05-verify", 800);
await step(`__click("Verify & Continue")`, 1500);
await step(`__click("My Exams")`, 2500);
await shot("06-exams", 1200);

const started = await browser.eval(`(async () => {
  const cards = [...document.querySelectorAll("button")].filter((b) => /Start exam|Resume exam/.test(b.textContent) && !b.disabled);
  if (!cards.length) return false;
  cards[0].scrollIntoView({ block: "center" });
  cards[0].click();
  return true;
})()`);
console.log("exam started:", started);
await browser.sleep(2500);
await step(`try { __click("Enable Camera") } catch {}`, 4000); // fake camera warm-up
await shot("07-proctor-setup", 500);

await step(`__click("Start Proctored Exam")`, 3000);
await shot("08-exam-question", 800);
// Answer the first two questions on screen
await step(`__click("B.", "button")`, 900).catch(() => {});
await browser.eval(`(async () => {
  const opt = [...document.querySelectorAll("button")].find((b) => /^A/.test(b.textContent.trim()) && b.querySelector("span"));
  opt?.click();
  return true;
})()`);
await browser.sleep(900);
await shot("09-exam-answered", 400);

// Answer every question, then submit
await browser.eval(`(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 12; i++) {
    const opts = [...document.querySelectorAll("button")].filter((b) => /^[A-D]/.test(b.textContent.trim()) && b.querySelector("span.grid"));
    if (opts.length) opts[Math.min(i % 4, opts.length - 1)].click();
    await sleep(500);
    const next = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Next") && !b.disabled);
    if (!next) break;
    next.click();
    await sleep(500);
  }
  return true;
})()`);
await browser.sleep(800);
await step(`__click("Submit")`, 900);
await step(`
  const confirmBtn = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("unanswered"));
  confirmBtn?.click();
`, 3500);
await shot("10-result", 1500);

// Ava evaluation of that attempt
await step(`__click("Review with Ava")`, 3500);
await shot("11-ava-review", 1500);

// Ava doubt clarification
await step(`__click("Ask Ava")`, 600);
await step(`__click("What is normalization?")`, 2500);
await shot("12-ava-chat", 1500);

// 4. Admin analytics
await loginAs("demo_admin");
await shot("13-admin", 3500);

await browser.close();
console.log("done");
