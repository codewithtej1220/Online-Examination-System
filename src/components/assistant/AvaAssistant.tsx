import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bot, CheckCircle2, ChevronDown, CircleHelp, ClipboardCheck, Loader2, MessageCircle, Send, Sparkles, X, XCircle } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { ScoreRing } from "../ui/score-ring";
import type { AvaMood } from "./Mascot3D";

const Mascot3D = lazy(() => import("./Mascot3D"));

type Role = "admin" | "faculty" | "student";
type Action = { label: string; view: string };
type Message = { id: number; role: "user" | "assistant"; text: string; actions?: Action[]; source?: string };

type Review = {
  attempt: { attempt_id: number; title: string; published: boolean };
  summary: { correct: number; total: number; unanswered: number; percent: number };
  topics: { name: string; correct: number; total: number; percent: number }[];
  difficulties: { name: string; correct: number; total: number; percent: number }[];
  feedback: string[];
  revealAnswers: boolean;
  questions: { question_id: number; content: string; options: Record<string, string>; selected: string | null; is_correct: boolean; correct_answer: string | null; topic: string; difficulty: string }[];
};

export const AVA_REVIEW_EVENT = "oes:ava-review";

/** Ask Ava (from anywhere in the app) to evaluate a specific attempt. */
export function openAvaReview(attemptId: number) {
  window.dispatchEvent(new CustomEvent(AVA_REVIEW_EVENT, { detail: attemptId }));
}

const VIEW_TIPS: Record<Role, Record<string, string>> = {
  student: {
    verification: "Confirm your student ID here — then I'll take you to your exams.",
    exams: "Pick an exam card and press Start. Keep your face in view of the camera during the test!",
    results: "Want feedback? Press \"Review with Ava\" on any result and I'll analyse it.",
    progress: "Every correct answer earns points. Can you unlock Perfect Score?"
  },
  faculty: {
    questions: "Tip: click a letter next to an option to mark it as the correct answer.",
    generator: "Paste notes with one concept per line and I'll turn them into MCQs.",
    exams: "Click an exam card to select it, then attach questions and assign students.",
    monitoring: "Choose an exam to watch students' proctoring alerts in real time."
  },
  admin: {
    dashboard: "These charts update from live data. Hover a card to see it highlight.",
    users: "Filter by role or search a username to find anyone quickly.",
    database: "The console is read-only — press Ctrl + Enter to run a query."
  }
};

const QUICK_PROMPTS: Record<Role, string[]> = {
  student: ["How do I start an exam?", "What is normalization?", "Is there negative marking?", "Explain primary vs foreign key"],
  faculty: ["How do I generate a test?", "How do I assign students?", "How does live monitoring work?", "What is BCNF?"],
  admin: ["What can the admin console do?", "How is the average score calculated?", "Explain ACID properties"]
};

function stripHtml(html: string) {
  if (!html || !html.includes("<")) return html;
  return new DOMParser().parseFromString(html, "text/html").body.textContent || "";
}

async function call<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.message || `Request failed (${response.status})`);
  return data as T;
}

export default function AvaAssistant({
  token,
  role,
  name,
  userId,
  view,
  hidden,
  onNavigate
}: {
  token: string;
  role: Role;
  name: string;
  userId: number;
  view: string;
  hidden?: boolean;
  onNavigate: (view: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "evaluate">("chat");
  const [bubble, setBubble] = useState<string | null>(null);
  const [mood, setMood] = useState<AvaMood>("wave");
  const [talking, setTalking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "assistant", text: `Hi ${name}! I'm Ava 👋 I can evaluate your tests, clear your doubts, and show you around. What do you need?` }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [attempts, setAttempts] = useState<{ attempt_id: number; exam_title: string; percent: number; submitted_at: string }[]>([]);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const talkTimer = useRef<number>(0);
  const bubbleTimer = useRef<number>(0);

  const speak = useCallback((text: string, nextMood: AvaMood = "explain") => {
    setMood(nextMood);
    setTalking(true);
    window.clearTimeout(talkTimer.current);
    talkTimer.current = window.setTimeout(() => {
      setTalking(false);
      setMood("idle");
    }, Math.min(4500, 900 + text.length * 25));
  }, []);

  // Greet once per browser session, then show a tip for each new page
  useEffect(() => {
    let greeted = false;
    try {
      greeted = sessionStorage.getItem("ava-greeted") === "1";
      sessionStorage.setItem("ava-greeted", "1");
    } catch {
      /* storage unavailable: just greet */
    }
    const text = greeted ? VIEW_TIPS[role][view] : `Hi ${name}! I'm Ava, your guide. Tap me any time for help.`;
    if (!text || open) return;
    setBubble(text);
    speak(text, greeted ? "explain" : "wave");
    window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setBubble(null), 7000);
  }, [view]);

  useEffect(() => () => {
    window.clearTimeout(talkTimer.current);
    window.clearTimeout(bubbleTimer.current);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const loadReview = useCallback(async (attemptId: number) => {
    setReviewLoading(true);
    setReviewError("");
    setMood("think");
    try {
      const data = await call<{ data: Review }>(`/api/assistant/review/${attemptId}`, token);
      setReview(data.data);
      const pct = data.data.summary.percent;
      speak(data.data.feedback[0], pct >= 75 ? "cheer" : "explain");
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Could not load the evaluation");
      setMood("idle");
    } finally {
      setReviewLoading(false);
    }
  }, [token, speak]);

  const loadAttempts = useCallback(async () => {
    if (role !== "student") return;
    try {
      const data = await call<{ results: Record<string, unknown>[] }>(`/api/results/student/${userId}`, token);
      setAttempts(
        (data.results || []).map((row) => ({
          attempt_id: Number(row.attempt_id),
          exam_title: String(row.exam_title ?? `Exam #${row.exam_id}`),
          percent: Number(row.total_questions) ? Math.round((Number(row.total_marks) / Number(row.total_questions)) * 100) : 0,
          submitted_at: String(row.submitted_at)
        }))
      );
    } catch {
      setAttempts([]);
    }
  }, [role, token, userId]);

  // Other parts of the app can open an evaluation directly
  useEffect(() => {
    const onReview = (event: Event) => {
      const attemptId = (event as CustomEvent<number>).detail;
      setOpen(true);
      setBubble(null);
      setTab("evaluate");
      loadAttempts();
      loadReview(attemptId);
    };
    window.addEventListener(AVA_REVIEW_EVENT, onReview);
    return () => window.removeEventListener(AVA_REVIEW_EVENT, onReview);
  }, [loadAttempts, loadReview]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;
    const history = messages.slice(-8).map((m) => ({ role: m.role, text: m.text }));
    setMessages((current) => [...current, { id: Date.now(), role: "user", text: message }]);
    setInput("");
    setSending(true);
    setMood("think");
    try {
      const data = await call<{ data: { text: string; actions?: Action[]; mood?: string; source: string } }>("/api/assistant/chat", token, {
        method: "POST",
        body: JSON.stringify({ message, view, history })
      });
      const reply = data.data;
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: reply.text, actions: reply.actions, source: reply.source }]);
      speak(reply.text, (["wave", "cheer", "think", "explain"].includes(reply.mood || "") ? reply.mood : "explain") as AvaMood);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: "assistant", text: error instanceof Error ? `Sorry — ${error.message}` : "Sorry, something went wrong." }
      ]);
      setMood("idle");
    } finally {
      setSending(false);
    }
  }

  function toggle() {
    setOpen((value) => !value);
    setBubble(null);
    if (!open) {
      speak("hello", "wave");
      if (role === "student") loadAttempts();
    }
  }

  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-40 flex flex-col items-end gap-2 p-3 sm:p-5">
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="pointer-events-auto flex h-[min(560px,calc(100vh-11rem))] w-[min(400px,calc(100vw-1.5rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl"
            aria-label="Ava assistant"
          >
            <header className="relative flex items-center gap-3 overflow-hidden border-b border-border bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-white">
              <div className="absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/10" />
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white/15">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="relative min-w-0 flex-1">
                <p className="font-semibold leading-tight">Ava</p>
                <p className="text-xs text-indigo-100">Evaluation · Doubts · Directions</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close assistant" className="relative rounded-lg p-1.5 hover:bg-white/15">
                <X className="h-4 w-4" />
              </button>
            </header>

            {role === "student" && (
              <div className="grid grid-cols-2 gap-1 border-b border-border p-1.5">
                {([["chat", "Ask Ava", MessageCircle], ["evaluate", "Evaluate my test", ClipboardCheck]] as const).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setTab(id);
                      if (id === "evaluate") loadAttempts();
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors",
                      tab === id ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
              </div>
            )}

            {tab === "chat" || role !== "student" ? (
              <>
                <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((message) => (
                    <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                          message.role === "user"
                            ? "rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                            : "rounded-bl-md border border-border bg-muted/60"
                        )}
                      >
                        {message.text}
                        {message.actions && message.actions.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {message.actions.map((action) => (
                              <button
                                key={action.view + action.label}
                                onClick={() => {
                                  onNavigate(action.view);
                                  speak(action.label, "wave");
                                }}
                                className="rounded-full border border-indigo-500/30 bg-background px-2.5 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-500/10 dark:text-indigo-300"
                              >
                                {action.label} →
                              </button>
                            ))}
                          </div>
                        )}
                        {message.source === "offline" && <p className="mt-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">Offline guide</p>}
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-muted/60 px-4 py-3 text-muted-foreground" style={{ width: "fit-content" }}>
                      {[0, 1, 2].map((dot) => (
                        <motion.span key={dot} className="h-1.5 w-1.5 rounded-full bg-current" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: dot * 0.15 }} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="scrollbar-none flex gap-1.5 overflow-x-auto px-3 pb-2">
                  {QUICK_PROMPTS[role].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => send(prompt)}
                      className="shrink-0 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-indigo-500/40 hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    send(input);
                  }}
                  className="flex items-center gap-2 border-t border-border p-3"
                >
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask a doubt or where to go…"
                    aria-label="Message Ava"
                    className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    aria-label="Send"
                    className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white transition-opacity disabled:opacity-40"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </>
            ) : (
              <EvaluatePanel
                attempts={attempts}
                review={review}
                loading={reviewLoading}
                error={reviewError}
                onPick={loadReview}
                onBack={() => setReview(null)}
                onAsk={(text) => {
                  setTab("chat");
                  send(text);
                }}
              />
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <div className="pointer-events-auto relative flex items-end gap-2">
        <AnimatePresence>
          {bubble && !open && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative mb-16 max-w-[230px] rounded-2xl rounded-br-sm border border-border bg-card px-3.5 py-2.5 text-sm shadow-xl"
            >
              {bubble}
              <button onClick={() => setBubble(null)} aria-label="Dismiss tip" className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full border border-border bg-background text-muted-foreground">
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={toggle}
          aria-label={open ? "Close Ava assistant" : "Open Ava assistant"}
          aria-expanded={open}
          className="group relative rounded-[28px] outline-none transition-transform hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="absolute inset-x-3 bottom-1 top-8 -z-10 rounded-[28px] bg-gradient-to-br from-indigo-500/25 to-emerald-400/25 blur-xl transition-opacity group-hover:opacity-100" />
          <Suspense fallback={<div className="grid h-[127px] w-[110px] place-items-center"><Bot className="h-8 w-8 text-indigo-500" /></div>}>
            <Mascot3D mood={mood} talking={talking} size={110} />
          </Suspense>
          {!open && (
            <span className="absolute bottom-2 right-1 flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg">
              <CircleHelp className="h-3 w-3" /> Ask Ava
            </span>
          )}
          {open && (
            <span className="absolute bottom-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background shadow-lg">
              <ChevronDown className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function EvaluatePanel({
  attempts,
  review,
  loading,
  error,
  onPick,
  onBack,
  onAsk
}: {
  attempts: { attempt_id: number; exam_title: string; percent: number; submitted_at: string }[];
  review: Review | null;
  loading: boolean;
  error: string;
  onPick: (attemptId: number) => void;
  onBack: () => void;
  onAsk: (text: string) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Analysing your answers…</span>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        <p className="text-sm text-muted-foreground">Pick a test and I'll break down how you did, topic by topic.</p>
        {error && <p className="rounded-lg bg-red-500/10 p-2.5 text-sm text-red-600 dark:text-red-300">{error}</p>}
        {attempts.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No submitted tests yet.</p>}
        {attempts.map((attempt) => (
          <button
            key={attempt.attempt_id}
            onClick={() => onPick(attempt.attempt_id)}
            className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-md"
          >
            <span
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold",
                attempt.percent >= 75 ? "bg-emerald-500/15 text-emerald-600" : attempt.percent >= 50 ? "bg-indigo-500/15 text-indigo-600" : "bg-amber-500/15 text-amber-600"
              )}
            >
              {attempt.percent}%
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{attempt.exam_title}</span>
              <span className="text-xs text-muted-foreground">{new Date(attempt.submitted_at).toLocaleDateString()}</span>
            </span>
          </button>
        ))}
      </div>
    );
  }

  const weakest = review.topics.find((topic) => topic.percent < 50);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All tests
      </button>

      <div className="flex items-center gap-4">
        <ScoreRing percent={review.summary.percent} size={84} stroke={8} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{review.attempt.title}</p>
          <p className="text-sm text-muted-foreground">
            {review.summary.correct}/{review.summary.total} correct · {review.summary.unanswered} skipped
          </p>
        </div>
      </div>

      <div className="space-y-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-sm">
        {review.feedback.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>

      {review.topics.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">By topic</p>
          <div className="space-y-2">
            {review.topics.map((topic) => (
              <div key={topic.name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="truncate">{topic.name}</span>
                  <span className="text-muted-foreground">{topic.correct}/{topic.total}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${topic.percent}%` }}
                    className={cn("h-full rounded-full", topic.percent >= 75 ? "bg-emerald-500" : topic.percent >= 50 ? "bg-indigo-500" : "bg-amber-500")}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {weakest && (
        <button
          onClick={() => onAsk(`Explain the key ideas in ${weakest.name}`)}
          className="w-full rounded-xl border border-dashed border-indigo-500/40 p-2.5 text-sm text-indigo-600 transition-colors hover:bg-indigo-500/5 dark:text-indigo-300"
        >
          Help me revise {weakest.name} →
        </button>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Question by question</p>
        <div className="space-y-2">
          {review.questions.map((question, index) => (
            <div key={question.question_id} className="rounded-xl border border-border">
              <button onClick={() => setExpanded(expanded === index ? null : index)} className="flex w-full items-start gap-2 p-3 text-left text-sm">
                {question.is_correct ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className={cn("mt-0.5 h-4 w-4 shrink-0", question.selected ? "text-red-500" : "text-muted-foreground")} />
                )}
                <span className="line-clamp-2 flex-1">Q{index + 1}. {stripHtml(question.content)}</span>
              </button>
              {expanded === index && (
                <div className="space-y-1 border-t border-border p-3 text-xs">
                  {Object.entries(question.options).map(([letter, text]) => (
                    <p
                      key={letter}
                      className={cn(
                        "rounded-md px-2 py-1",
                        question.correct_answer === letter && "bg-emerald-500/10 font-medium text-emerald-700 dark:text-emerald-300",
                        question.selected === letter && !question.is_correct && "bg-red-500/10 text-red-700 dark:text-red-300"
                      )}
                    >
                      {letter}. {text}
                      {question.selected === letter && " · your answer"}
                      {question.correct_answer === letter && " · correct"}
                    </p>
                  ))}
                  {!question.selected && <p className="text-muted-foreground">You skipped this question.</p>}
                  <p className="pt-1 text-muted-foreground">{question.topic} · {question.difficulty}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
