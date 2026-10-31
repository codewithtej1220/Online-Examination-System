import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ClipboardList, FileText, Layers, Loader2, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { TiltCard } from "./ui/tilt-card";
import { cn } from "../lib/utils";

type Difficulty = "EASY" | "MEDIUM" | "HARD";
type GeneratedQuestion = {
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: "A" | "B" | "C" | "D";
  difficulty_level: Difficulty;
  subject_topic: string | null;
  tags?: string;
};
type TopicStat = { topic: string; EASY: number; MEDIUM: number; HARD: number; total: number };
type Notice = { tone: "success" | "error"; text: string } | null;

const SAMPLE_NOTES = `Primary key: a column that uniquely identifies each row in a table
Foreign key: a column that references the primary key of another table
Normalization: organizing tables to reduce redundancy and update anomalies
Transaction: a unit of work that either fully completes or is fully rolled back
Deadlock: two transactions each waiting for a lock held by the other
Index: a data structure that speeds up lookups on a column
View: a virtual table defined by a stored SELECT query
Trigger: SQL code that runs automatically when a table is modified`;

async function call<T>(path: string, token: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.message || `Request failed (${response.status})`);
  return data as T;
}

function NoticeLine({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p
      role={notice.tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border p-3 text-sm",
        notice.tone === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200"
      )}
    >
      {notice.text}
    </p>
  );
}

const selectClass = "min-h-11 w-full rounded-lg border border-input bg-background/70 px-3 text-sm";

export default function TestGenerator({ token, onChanged }: { token: string; onChanged: () => void }) {
  const [tool, setTool] = useState<"notes" | "builder">("notes");

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {([
          ["notes", "Notes → Questions", "Paste study notes and get ready-to-review MCQs", FileText, "139 92 246"],
          ["builder", "Auto Test Builder", "Assemble a full exam from your bank in one click", Layers, "16 185 129"]
        ] as const).map(([id, title, text, Icon, glow]) => (
          <TiltCard key={id} glow={glow} className={cn("cursor-pointer", tool === id && "glow-border")} onClick={() => setTool(id)}>
            <div className="flex items-center gap-4 p-5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, rgb(${glow}), rgb(${glow} / 0.65))` }}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          </TiltCard>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tool} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {tool === "notes" ? <NotesGenerator token={token} onSaved={onChanged} /> : <AutoTestBuilder token={token} onCreated={onChanged} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function NotesGenerator({ token, onSaved }: { token: string; onSaved: () => void }) {
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState("8");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [topic, setTopic] = useState("");
  const [useAi, setUseAi] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [preview, setPreview] = useState<GeneratedQuestion[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<"generate" | "save" | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    call<{ data: { aiAvailable: boolean } }>("/api/generator/topics", token)
      .then((data) => setAiAvailable(data.data.aiAvailable))
      .catch(() => setAiAvailable(false));
  }, [token]);

  async function generate() {
    setBusy("generate");
    setNotice(null);
    try {
      const data = await call<{ message: string; data: { questions: GeneratedQuestion[] } }>("/api/generator/from-notes", token, {
        notes,
        count: Number(count),
        difficulty,
        subject_topic: topic,
        mode: useAi ? "ai" : "offline"
      });
      setPreview(data.data.questions);
      setSelected(new Set(data.data.questions.map((_, index) => index)));
      setNotice({ tone: "success", text: `${data.message}. Review, edit and save the ones you like.` });
    } catch (error) {
      setPreview([]);
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Generation failed" });
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("save");
    try {
      const questions = preview.filter((_, index) => selected.has(index));
      const data = await call<{ message: string }>("/api/generator/save", token, { questions });
      setNotice({ tone: "success", text: data.message });
      setPreview([]);
      onSaved();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not save questions" });
    } finally {
      setBusy(null);
    }
  }

  function update(index: number, patch: Partial<GeneratedQuestion>) {
    setPreview((current) => current.map((question, i) => (i === index ? { ...question, ...patch } : question)));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
      <TiltCard maxTilt={2} lift={false} className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-violet-500" /> Generate from notes
          </CardTitle>
          <CardDescription>One concept per line works best, e.g. "Primary key: a column that uniquely identifies each row".</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Paste your notes or syllabus here…"
            className="min-h-56 w-full rounded-lg border border-input bg-background/70 p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="button" onClick={() => setNotes(SAMPLE_NOTES)} className="w-fit text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-300">
            Use sample DBMS notes
          </button>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-xs font-medium">
              Questions
              <Input type="number" min={1} max={30} value={count} onChange={(event) => setCount(event.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Difficulty
              <select className={selectClass} value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
                <option>EASY</option>
                <option>MEDIUM</option>
                <option>HARD</option>
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-xs font-medium">
            Topic (used to group questions)
            <Input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Database Management Systems" />
          </label>
          <label className={cn("flex items-center gap-2 rounded-lg border border-border p-3 text-sm", !aiAvailable && "opacity-60")}>
            <input type="checkbox" checked={useAi} disabled={!aiAvailable} onChange={(event) => setUseAi(event.target.checked)} className="h-4 w-4 accent-indigo-600" />
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="flex-1">Use AI (Gemini)</span>
            {!aiAvailable && <span className="text-xs text-muted-foreground">Set GEMINI_API_KEY to enable</span>}
          </label>
          <Button variant="premium" onClick={generate} disabled={busy !== null || notes.trim().length < 40}>
            {busy === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Generate questions
          </Button>
          <NoticeLine notice={notice} />
        </CardContent>
      </TiltCard>

      <div className="grid content-start gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Preview {preview.length > 0 && <span className="text-sm font-normal text-muted-foreground">({selected.size} of {preview.length} selected)</span>}</h3>
          {preview.length > 0 && (
            <Button variant="premium" onClick={save} disabled={busy !== null || selected.size === 0}>
              {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save {selected.size} to bank
            </Button>
          )}
        </div>
        {preview.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
            <Wand2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
            <p className="font-medium">Generated questions appear here</p>
            <p className="mt-1 text-sm text-muted-foreground">You can edit any field and pick the correct answer before saving.</p>
          </div>
        ) : (
          preview.map((question, index) => {
            const isSelected = selected.has(index);
            return (
              <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <div className={cn("rounded-xl border bg-card/80 p-4 transition-colors", isSelected ? "border-indigo-500/40" : "border-border opacity-60")}>
                  <div className="mb-3 flex items-start gap-3">
                    <input
                      type="checkbox"
                      aria-label={`Include question ${index + 1}`}
                      checked={isSelected}
                      onChange={() =>
                        setSelected((current) => {
                          const next = new Set(current);
                          if (next.has(index)) next.delete(index);
                          else next.add(index);
                          return next;
                        })
                      }
                      className="mt-2.5 h-4 w-4 accent-indigo-600"
                    />
                    <textarea
                      value={question.content}
                      onChange={(event) => update(index, { content: event.target.value })}
                      rows={2}
                      className="min-w-0 flex-1 resize-none rounded-lg border border-transparent bg-transparent p-2 text-sm font-medium outline-none hover:border-border focus:border-input focus:ring-2 focus:ring-ring"
                    />
                    <button onClick={() => setPreview((current) => current.filter((_, i) => i !== index))} aria-label="Remove question" className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(["A", "B", "C", "D"] as const).map((letter) => {
                      const field = `option_${letter.toLowerCase()}` as "option_a";
                      const correct = question.correct_answer === letter;
                      return (
                        <div key={letter} className="relative">
                          <button
                            type="button"
                            title="Mark as correct"
                            onClick={() => update(index, { correct_answer: letter })}
                            className={cn(
                              "absolute left-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-[11px] font-bold",
                              correct ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:bg-emerald-500/20"
                            )}
                          >
                            {letter}
                          </button>
                          <input
                            value={question[field]}
                            onChange={(event) => update(index, { [field]: event.target.value })}
                            className={cn("h-10 w-full rounded-lg border bg-background/70 pl-9 pr-2 text-sm outline-none focus:ring-2 focus:ring-ring", correct ? "border-emerald-500/50" : "border-input")}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

function AutoTestBuilder({ token, onCreated }: { token: string; onCreated: () => void }) {
  const [topics, setTopics] = useState<TopicStat[]>([]);
  const [source, setSource] = useState<"mine" | "all">("mine");
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [mix, setMix] = useState<Record<Difficulty, number>>({ EASY: 30, MEDIUM: 50, HARD: 20 });
  const [form, setForm] = useState({ title: "", duration_minutes: "30", scheduled_time: "", question_count: "10" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [created, setCreated] = useState<{ exam_id: number; question_count: number; breakdown: Record<Difficulty, number> } | null>(null);

  useEffect(() => {
    call<{ data: { topics: TopicStat[] } }>(`/api/generator/topics?scope=${source}`, token)
      .then((data) => setTopics(data.data.topics))
      .catch((error) => setNotice({ tone: "error", text: error.message }));
    setChosen(new Set());
  }, [token, source]);

  const pool = useMemo(() => {
    const included = topics.filter((topic) => chosen.size === 0 || chosen.has(topic.topic));
    return included.reduce(
      (sum, topic) => ({ EASY: sum.EASY + topic.EASY, MEDIUM: sum.MEDIUM + topic.MEDIUM, HARD: sum.HARD + topic.HARD, total: sum.total + topic.total }),
      { EASY: 0, MEDIUM: 0, HARD: 0, total: 0 }
    );
  }, [topics, chosen]);

  const mixTotal = mix.EASY + mix.MEDIUM + mix.HARD || 1;
  const wanted = Number(form.question_count) || 0;

  async function build() {
    setBusy(true);
    setNotice(null);
    setCreated(null);
    try {
      const data = await call<{ message: string; data: { exam_id: number; question_count: number; breakdown: Record<Difficulty, number> } }>("/api/generator/auto-test", token, {
        ...form,
        duration_minutes: Number(form.duration_minutes),
        question_count: Number(form.question_count),
        topics: [...chosen],
        difficulty_mix: mix,
        source
      });
      setCreated(data.data);
      setNotice({ tone: "success", text: data.message });
      onCreated();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Could not build the test" });
    } finally {
      setBusy(false);
    }
  }

  const colors: Record<Difficulty, string> = { EASY: "bg-emerald-500", MEDIUM: "bg-amber-500", HARD: "bg-red-500" };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <TiltCard maxTilt={2} lift={false}>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-500" /> Choose topics
            </CardTitle>
            <CardDescription>Leave everything unselected to draw from all topics.</CardDescription>
          </div>
          <div className="grid grid-cols-2 rounded-lg bg-muted p-1 text-xs">
            {(["mine", "all"] as const).map((item) => (
              <button key={item} onClick={() => setSource(item)} className={cn("rounded-md px-3 py-1.5 font-medium", source === item && "bg-background shadow-sm")}>
                {item === "mine" ? "My questions" : "Whole bank"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          {topics.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No questions in this bank yet — generate some from notes first.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {topics.map((topic) => {
                const active = chosen.has(topic.topic);
                return (
                  <button
                    key={topic.topic}
                    onClick={() =>
                      setChosen((current) => {
                        const next = new Set(current);
                        if (next.has(topic.topic)) next.delete(topic.topic);
                        else next.add(topic.topic);
                        return next;
                      })
                    }
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5",
                      active ? "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_0_3px_rgb(16_185_129/0.12)]" : "border-border hover:border-emerald-500/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{topic.topic}</span>
                      {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <span className="text-xs text-muted-foreground">{topic.total}</span>}
                    </div>
                    <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
                      {(["EASY", "MEDIUM", "HARD"] as const).map((level) => (
                        <div key={level} className={colors[level]} style={{ width: `${(topic[level] / topic.total) * 100}%` }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div>
            <p className="mb-3 text-sm font-medium">Difficulty mix</p>
            <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-muted">
              {(["EASY", "MEDIUM", "HARD"] as const).map((level) => (
                <motion.div key={level} className={colors[level]} animate={{ width: `${(mix[level] / mixTotal) * 100}%` }} />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["EASY", "MEDIUM", "HARD"] as const).map((level) => (
                <label key={level} className="grid gap-1 text-xs">
                  <span className="flex justify-between font-medium">
                    {level.charAt(0) + level.slice(1).toLowerCase()}
                    <span className="text-muted-foreground">
                      ~{Math.round((wanted * mix[level]) / mixTotal)} q · {pool[level]} available
                    </span>
                  </span>
                  <input type="range" min={0} max={100} step={5} value={mix[level]} onChange={(event) => setMix({ ...mix, [level]: Number(event.target.value) })} className="accent-indigo-600" />
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </TiltCard>

      <div className="grid content-start gap-4">
        <TiltCard maxTilt={3} glow="16 185 129">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-500" /> Test details
            </CardTitle>
            <CardDescription>{pool.total} matching questions in the pool</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input placeholder="Test title, e.g. DBMS Unit 2 Quiz" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-xs font-medium">
                Questions
                <Input type="number" min={1} max={100} value={form.question_count} onChange={(event) => setForm({ ...form, question_count: event.target.value })} />
              </label>
              <label className="grid gap-1 text-xs font-medium">
                Minutes
                <Input type="number" min={1} max={300} value={form.duration_minutes} onChange={(event) => setForm({ ...form, duration_minutes: event.target.value })} />
              </label>
            </div>
            <label className="grid gap-1 text-xs font-medium">
              Scheduled time
              <Input type="datetime-local" value={form.scheduled_time} onChange={(event) => setForm({ ...form, scheduled_time: event.target.value })} />
            </label>
            {wanted > pool.total && pool.total > 0 && <p className="text-xs text-amber-600 dark:text-amber-400">Only {pool.total} questions match — the test will use all of them.</p>}
            <Button variant="premium" onClick={build} disabled={busy || !form.title || !form.scheduled_time || !wanted || pool.total === 0}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Generate test
            </Button>
            <NoticeLine notice={notice} />
          </CardContent>
        </TiltCard>

        {created && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <TiltCard glow="16 185 129" className="glow-border">
              <div className="p-5">
                <p className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" /> Exam #{created.exam_id} is ready
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{created.question_count} questions · open to all students until you assign specific ones in Exam Studio.</p>
                <div className="mt-3 flex gap-2">
                  {(["EASY", "MEDIUM", "HARD"] as const).map((level) => (
                    <span key={level} className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
                      <span className={cn("h-2 w-2 rounded-full", colors[level])} /> {created.breakdown[level] || 0} {level.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            </TiltCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
