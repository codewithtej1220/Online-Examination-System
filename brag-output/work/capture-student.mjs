// Re-capture the student flow on a fresh exam with a strong (7/8) result.
import { readFileSync, writeFileSync } from "node:fs";
import { launch } from "./cdp.mjs";

const API = "http://localhost:5000/api";
const BASE = "http://localhost:5000/app/";
const OUT = new URL("./shots/", import.meta.url);
const PASSWORD = readFileSync(new URL("../../scripts/seed.js", import.meta.url), "utf8").match(/const password = "([^"]+)"/)[1];

const login = async (username) => {
  const r = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password: PASSWORD }) });
  return (await r.json()).data;
};
const get = async (path, token) => (await fetch(API + path, { headers: { Authorization: `Bearer ${token}` } })).json();

const faculty = await login("demo_faculty");
const student = await login("demo_student");

const exams = (await get(`/student-exams/${student.user.user_id}`, student.token)).exams;
const exam = exams.find((e) => !e.attempt_status && Number(e.question_count) >= 5);
if (!exam) throw new Error("No fresh exam available for the student");
const paper = await get(`/exams/paper/${exam.exam_id}`, student.token);
const bank = (await get("/questions/all", faculty.token)).questions;
const answerOf = new Map(bank.map((q) => [Number(q.question_id), q.correct_answer]));
// Correct answers in paper order, with one deliberate miss for a realistic score
const plan = paper.questions.map((q, i) => {
  const correct = answerOf.get(Number(q.question_id));
  return i === 2 ? ["A", "B", "C", "D"].find((l) => l !== correct) : correct;
});
console.log("exam", exam.exam_id, exam.title, "answers", plan.join(""));

const browser = await launch({
  width: 1600,
  height: 1000,
  extraArgs: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"]
});
await browser.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
const shot = async (name, settle = 900) => {
  await browser.sleep(settle);
  writeFileSync(new URL(`${name}.png`, OUT), await browser.screenshot("png"));
  console.log("captured", name);
};
const run = (js) => browser.eval(`(async () => { ${js} })()`);
const click = (text) => run(`
  const el = [...document.querySelectorAll("button")].find((n) => n.textContent.includes(${JSON.stringify(text)}) && !n.disabled);
  if (!el) throw new Error("missing: " + ${JSON.stringify(text)});
  el.click(); return true;`);

await browser.goto(BASE, 800);
await run(`localStorage.clear(); sessionStorage.setItem("ava-greeted", "1");
  localStorage.setItem("oesToken", ${JSON.stringify(student.token)});
  localStorage.setItem("oesUser", ${JSON.stringify(JSON.stringify(student.user))}); return true;`);
await browser.goto(BASE, 2500);
await click("Verify & Continue");
await browser.sleep(1500);
await click("My Exams");
await shot("06-exams", 2000);

await run(`
  const card = [...document.querySelectorAll(".tilt-card")].find((c) => c.textContent.includes(${JSON.stringify(exam.title)}));
  [...card.querySelectorAll("button")].find((b) => b.textContent.includes("Start exam")).click(); return true;`);
await browser.sleep(6000); // fake camera warm-up
await run(`window.scrollTo(0, 0); return true;`);
await shot("07-proctor-setup", 800);

await click("Start Proctored Exam");
await browser.sleep(2500);
await run(`window.scrollTo(0, 0); return true;`);
await shot("08-exam-question", 600);

const choose = (letter) => run(`
  const opt = [...document.querySelectorAll("button")].find((b) => b.querySelector("span.grid") && b.querySelector("span.grid").textContent.trim() === ${JSON.stringify(letter)});
  opt.click(); return true;`);

for (let i = 0; i < plan.length; i++) {
  await choose(plan[i]);
  await browser.sleep(700);
  if (i === 1) {
    await run(`window.scrollTo(0, 0); return true;`);
    await shot("09-exam-answered", 400);
  }
  if (i < plan.length - 1) {
    await click("Next");
    await browser.sleep(600);
  }
}
await click("Submit Exam");
await browser.sleep(3500);
await run(`window.scrollTo(0, 0); return true;`);
await shot("10-result", 1500);

await click("Review with Ava");
await shot("11-ava-review", 4000);

await click("Ask Ava");
await browser.sleep(600);
await click("What is normalization?");
await shot("12-ava-chat", 3000);

await browser.close();
console.log("done");
