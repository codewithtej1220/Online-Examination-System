// Seed demo content through the app's own generator API (as demo_faculty).
import { readFileSync } from "node:fs";

const API = "http://localhost:5000/api";
const PASSWORD = readFileSync(new URL("../../scripts/seed.js", import.meta.url), "utf8").match(/const password = "([^"]+)"/)[1];

async function call(path, token, body) {
  const response = await fetch(API + path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${path}: ${data.message}`);
  return data;
}

const { data: login } = await call("/auth/login", null, { username: "demo_faculty", password: PASSWORD });
const token = login.token;

const banks = [
  {
    topic: "Database Management Systems",
    notes: `Primary key: a column that uniquely identifies each row in a table
Foreign key: a column that references the primary key of another table
Normalization: organizing tables to reduce redundancy and update anomalies
Transaction: a unit of work that either fully completes or is fully rolled back
Deadlock: two transactions each waiting for a lock held by the other
Index: a data structure that speeds up lookups on a column
View: a virtual table defined by a stored SELECT query
Trigger: SQL code that runs automatically when a table is modified`
  },
  {
    topic: "Operating Systems",
    notes: `Process: a program in execution with its own address space
Thread: the smallest unit of execution scheduled by the operating system
Semaphore: a counter used to control access to a shared resource
Paging: dividing memory into fixed-size pages to avoid external fragmentation
Context switch: saving one process state and loading another on the CPU
Starvation: a process waiting indefinitely because others keep getting priority
Virtual memory: using disk space to extend the apparent size of main memory`
  },
  {
    topic: "Computer Networks",
    notes: `TCP: a connection-oriented protocol that guarantees ordered, reliable delivery
UDP: a connectionless protocol with no delivery guarantees but low overhead
DNS: the system that translates domain names into IP addresses
Router: a device that forwards packets between different networks
Subnet mask: a value that separates the network and host parts of an IP address
HTTP: the application protocol used to transfer web pages`
  }
];

for (const bank of banks) {
  for (const difficulty of ["EASY", "MEDIUM", "HARD"]) {
    const { data } = await call("/generator/from-notes", token, { notes: bank.notes, count: 5, difficulty, subject_topic: bank.topic });
    await call("/generator/save", token, { questions: data.questions });
  }
  console.log("bank ready:", bank.topic);
}

const when = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16);
for (const [title, topics, count] of [
  ["DBMS Unit 2 Quiz", ["Database Management Systems"], 6],
  ["Operating Systems Midterm", ["Operating Systems"], 8],
  ["Networks Weekly Test", ["Computer Networks"], 5]
]) {
  const { data } = await call("/generator/auto-test", token, {
    title,
    duration_minutes: 20,
    scheduled_time: when,
    question_count: count,
    topics,
    difficulty_mix: { EASY: 30, MEDIUM: 50, HARD: 20 }
  });
  console.log("exam created:", title, data.exam_id);
}
