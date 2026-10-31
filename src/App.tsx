import DOMPurify from "dompurify";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Database,
  Eye,
  EyeOff,
  FileQuestion,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mic,
  MicOff,
  Moon,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  Trophy,
  User,
  Users,
  Wand2,
  Calculator as CalculatorIcon
} from "lucide-react";
import { useTheme } from "next-themes";
import { type FormEvent, type ReactNode, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { TiltCard } from "./components/ui/tilt-card";
import { AnimatedNumber } from "./components/ui/animated-number";
import { ScoreRing } from "./components/ui/score-ring";
import { cn } from "./lib/utils";

import Hero3D from "./components/Hero3D";
import ProctoredExam from "./components/ProctoredExam";
import ExamTimer from "./components/ExamTimer";
import QuestionNavigation from "./components/QuestionNavigation";
import Calculator from "./components/Calculator";
import QuestionImport from "./components/QuestionImport";
import RichTextEditor from "./components/RichTextEditor";
import FacultyMonitoring from "./components/FacultyMonitoring";
import AdminAnalytics, { type AdminOverview } from "./components/AdminAnalytics";
import Gamification from "./components/Gamification";
import AICoPilot from "./components/AICoPilot";
import TestGenerator from "./components/TestGenerator";
import AvaAssistant, { openAvaReview } from "./components/assistant/AvaAssistant";

const Mascot3D = lazy(() => import("./components/assistant/Mascot3D"));

type Role = "admin" | "faculty" | "student";

type UserSession = {
  token: string;
  user: {
    user_id: number;
    username: string;
    role: Role;
  };
};

type Row = Record<string, unknown>;

type ApiResult = Row & {
  success?: boolean;
  message?: string;
  error?: string;
};

type Exam = {
  exam_id: number;
  faculty_user_id?: number;
  title: string;
  duration_minutes: number;
  scheduled_time?: string;
  question_count?: number;
  attempt_status?: string | null;
};

type Question = {
  question_id: number;
  content: string;
  question_type: string;
  options: Record<"A" | "B" | "C" | "D", string>;
};

type Notice = { tone: "success" | "error" | "info" | "warning"; text: string } | null;

const SESSION_EXPIRED_EVENT = "oes:session-expired";

async function api<T extends ApiResult>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    throw new Error("Cannot reach the server. Make sure the backend is running.");
  }
  const data = (await response.json().catch(() => ({}))) as T & { errors?: { message?: string; msg?: string }[] };

  // An expired or invalid token logs the user out instead of leaving a broken session
  if (response.status === 401 && token) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }

  if (!response.ok || data.success === false) {
    const detail = Array.isArray(data.errors) ? data.errors.map((e) => e.message || e.msg).filter(Boolean).join(", ") : "";
    throw new Error(detail || data.error || data.message || `Request failed: ${response.status}`);
  }

  return data;
}

function getStoredSession(): UserSession | null {
  try {
    const token = localStorage.getItem("oesToken");
    const user = localStorage.getItem("oesUser");
    if (!token || !user) return null;
    return { token, user: JSON.parse(user) };
  } catch {
    return null;
  }
}

function errorText(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function stripHtml(html: string) {
  if (!html || !html.includes("<")) return html;
  return new DOMParser().parseFromString(html, "text/html").body.textContent || "";
}

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function percentOf(row: Row) {
  const total = Number(row.total_questions) || 0;
  return total ? (Number(row.total_marks) / total) * 100 : 0;
}

/* ------------------------------------------------------------------ */
/* Shared UI                                                           */
/* ------------------------------------------------------------------ */

const NAV: Record<Role, { id: string; label: string; icon: typeof Activity }[]> = {
  admin: [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Users & Results", icon: Users },
    { id: "database", label: "Database Console", icon: Database }
  ],
  faculty: [
    { id: "questions", label: "Question Bank", icon: FileQuestion },
    { id: "generator", label: "Test Generator", icon: Wand2 },
    { id: "exams", label: "Exam Studio", icon: ClipboardList },
    { id: "monitoring", label: "Live Monitoring", icon: Activity }
  ],
  student: [
    { id: "verification", label: "ID Verification", icon: ShieldCheck },
    { id: "exams", label: "My Exams", icon: GraduationCap },
    { id: "results", label: "Results", icon: CheckCircle2 },
    { id: "progress", label: "Progress", icon: Trophy }
  ]
};

const ROLE_THEME: Record<Role, { title: string; subtitle: string; gradient: string; glow: string; glow2: string }> = {
  admin: { title: "Admin Control Center", subtitle: "System health, people and data", gradient: "from-indigo-600 to-cyan-500", glow: "99 102 241", glow2: "6 182 212" },
  faculty: { title: "Faculty Exam Studio", subtitle: "Author, schedule and monitor exams", gradient: "from-violet-600 to-pink-500", glow: "139 92 246", glow2: "236 72 153" },
  student: { title: "Student Exam Portal", subtitle: "Take exams and track your growth", gradient: "from-emerald-500 to-teal-500", glow: "16 185 129", glow2: "20 184 166" }
};

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      aria-label="Toggle theme"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative overflow-hidden"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

function NoticeBanner({ notice }: { notice: Notice }) {
  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role={notice.tone === "error" ? "alert" : "status"}
          className={cn(
            "rounded-lg border p-3 text-sm",
            notice.tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
            notice.tone === "error" && "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200",
            notice.tone === "warning" && "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
            notice.tone === "info" && "border-border bg-muted"
          )}
        >
          {notice.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ViewFade({ viewKey, children }: { viewKey: string; children: ReactNode }) {
  return (
    <motion.div key={viewKey} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: typeof Activity; title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
      <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/70" />
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "indigo" | "emerald" | "amber" | "red" | "violet" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-muted text-muted-foreground",
        tone === "indigo" && "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
        tone === "emerald" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        tone === "amber" && "bg-amber-500/10 text-amber-600 dark:text-amber-300",
        tone === "red" && "bg-red-500/10 text-red-600 dark:text-red-300",
        tone === "violet" && "bg-violet-500/10 text-violet-600 dark:text-violet-300"
      )}
    >
      {children}
    </span>
  );
}

const ROLE_TONE = { admin: "amber", faculty: "indigo", student: "emerald" } as const;
const DIFFICULTY_TONE = { EASY: "emerald", MEDIUM: "amber", HARD: "red" } as const;

type Column = { key: string; label: string; render?: (row: Row) => ReactNode };

function DataTable({ rows, columns, maxHeight = "28rem" }: { rows: Row[]; columns?: Column[]; maxHeight?: string }) {
  const cols: Column[] = columns ?? (rows[0] ? Object.keys(rows[0]).slice(0, 8).map((key) => ({ key, label: key.replace(/_/g, " ") })) : []);

  if (!rows.length) {
    return <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">No data available.</div>;
  }

  return (
    <div className="overflow-auto rounded-lg border border-border" style={{ maxHeight }}>
      <table className="w-full min-w-[640px] text-sm">
        <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
          <tr>
            {cols.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="row-highlight border-t border-border">
              {cols.map((column) => (
                <td key={column.key} className="max-w-72 truncate px-3 py-2.5">
                  {column.render ? column.render(row) : formatCell(column.key, row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>;
  if (/(_at|_time)$/.test(key)) return formatDate(value);
  if (key === "content") return stripHtml(String(value));
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function RichContent({ html, className }: { html: string; className?: string }) {
  const clean = useMemo(() => DOMPurify.sanitize(html), [html]);
  return <div className={cn("question-content", className)} dangerouslySetInnerHTML={{ __html: clean }} />;
}

/* ------------------------------------------------------------------ */
/* App shell                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_VIEW: Record<Role, string> = { admin: "dashboard", faculty: "questions", student: "verification" };

function App() {
  const [session, setSession] = useState<UserSession | null>(() => getStoredSession());
  const [activeView, setActiveView] = useState<string>(() => DEFAULT_VIEW[getStoredSession()?.user.role ?? "student"]);
  const [navLocked, setNavLocked] = useState(false);
  const [expiredNotice, setExpiredNotice] = useState("");

  function finishLogin(next: UserSession) {
    localStorage.setItem("oesToken", next.token);
    localStorage.setItem("oesUser", JSON.stringify(next.user));
    setActiveView(DEFAULT_VIEW[next.user.role]);
    setExpiredNotice("");
    setSession(next);
  }

  const logout = useCallback(() => {
    localStorage.removeItem("oesToken");
    localStorage.removeItem("oesUser");
    setNavLocked(false);
    setSession(null);
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setExpiredNotice("Your session has expired. Please log in again.");
      logout();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [logout]);

  if (!session) {
    return <AuthGate onLogin={finishLogin} initialMessage={expiredNotice} />;
  }

  const role = session.user.role;
  const theme = ROLE_THEME[role];
  const navItems = NAV[role];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 border-r border-border bg-card/60 p-4 backdrop-blur-xl lg:block">
          <div className="flex h-full flex-col gap-5">
            <div className="flex items-center gap-3 p-2">
              <div className={cn("grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", theme.gradient)}>
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold tracking-tight">OES Pro</p>
                <p className="text-xs text-muted-foreground">Online Examination System</p>
              </div>
            </div>

            <TiltCard glow={theme.glow} maxTilt={6}>
              <div className="flex items-center gap-3 p-4">
                <div className={cn("grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br text-sm font-bold uppercase text-white", theme.gradient)}>
                  {session.user.username.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{session.user.username}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {role} · ID {session.user.user_id}
                  </p>
                </div>
              </div>
            </TiltCard>

            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Workspace</p>
            <nav className="-mt-3 grid gap-1 text-sm" aria-label="Workspace">
              {navItems.map((item) => (
                <NavButton
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeView === item.id}
                  disabled={navLocked && activeView !== item.id}
                  onClick={() => setActiveView(item.id)}
                />
              ))}
            </nav>

            {navLocked && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-200">
                Navigation is locked while your exam is in progress.
              </p>
            )}

            <div className="mt-auto flex items-center justify-between rounded-xl border border-border bg-card/70 p-2">
              <ThemeToggle />
              <Button variant="ghost" onClick={logout} disabled={navLocked}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        <main className="app-canvas min-w-0 flex-1 p-4 pb-40 lg:p-8 lg:pb-40">
          <header
            className="mesh-banner mb-6 rounded-2xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur-xl lg:p-6"
            style={{ ["--banner" as string]: theme.glow, ["--banner-2" as string]: theme.glow2 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white lg:hidden", theme.gradient)}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                  </p>
                  <h1 className="mt-0.5 text-xl font-bold tracking-tight lg:text-[1.65rem]">
                    {greeting()}, <span className={cn("bg-gradient-to-r bg-clip-text text-transparent", theme.gradient)}>{session.user.username}</span>
                  </h1>
                  <p className="text-sm text-muted-foreground">{theme.title} · {theme.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <ThemeToggle />
                <Button variant="outline" size="icon" aria-label="Logout" onClick={logout} disabled={navLocked}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              <div className="hidden items-center gap-2 lg:flex">
                <Badge tone={ROLE_TONE[role]}>{role} workspace</Badge>
                <span className="text-sm text-muted-foreground">ID {session.user.user_id}</span>
              </div>
            </div>

            {/* Mobile / tablet navigation */}
            <nav className="scrollbar-none -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden" aria-label="Workspace">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    disabled={navLocked && !active}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-40",
                      active ? "border-indigo-500/50 bg-indigo-500/10 font-medium text-indigo-600 dark:text-indigo-300" : "border-border text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </header>

          {role === "admin" && <AdminWorkspace session={session} activeView={activeView} />}
          {role === "faculty" && <FacultyWorkspace session={session} activeView={activeView} />}
          {role === "student" && (
            <StudentWorkspace session={session} activeView={activeView} onNavigate={setActiveView} onLockNavigation={setNavLocked} />
          )}
        </main>
      </div>

      <AvaAssistant
        token={session.token}
        role={role}
        name={session.user.username}
        userId={session.user.user_id}
        view={activeView}
        hidden={navLocked}
        onNavigate={setActiveView}
      />
    </div>
  );
}

function NavButton({ icon: Icon, label, active, disabled, onClick }: { icon: typeof Activity; label: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active ? "font-medium text-indigo-600 dark:text-indigo-300" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-lg border border-indigo-500/20 bg-indigo-500/10"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <Icon className="relative h-4 w-4" />
      <span className="relative">{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Login / registration                                                */
/* ------------------------------------------------------------------ */

function AuthGate({ onLogin, initialMessage }: { onLogin: (session: UserSession) => void; initialMessage?: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Exclude<Role, "admin">>("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [major, setMajor] = useState("");
  const [notice, setNotice] = useState<Notice>(initialMessage ? { tone: "warning", text: initialMessage } : null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setNotice(null);
    try {
      if (mode === "register") {
        const result = await api<{ success: boolean; message: string; data: { user_id: number } }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            username,
            password,
            role,
            department: department || undefined,
            current_semester: semester ? Number(semester) : undefined,
            major_program: major || undefined
          })
        });
        setNotice({ tone: "success", text: `${result.message}. Your ID is ${result.data.user_id} — you can log in now.` });
        setMode("login");
        setPassword("");
        return;
      }

      const result = await api<{ success: boolean; data: { token: string; user: UserSession["user"] } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      onLogin({ token: result.data.token, user: result.data.user });
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "Request failed") });
    } finally {
      setLoading(false);
    }
  }

  const features = [
    { icon: Sparkles, title: "AI question generation", text: "Turn a syllabus into a ready question bank", color: "text-amber-300 bg-amber-400/15" },
    { icon: ShieldCheck, title: "AI proctoring", text: "Face, gaze, audio and tab-switch monitoring", color: "text-indigo-300 bg-indigo-400/15" },
    { icon: CheckCircle2, title: "Instant grading", text: "Auto-evaluated results with analytics", color: "text-emerald-300 bg-emerald-400/15" }
  ];

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1.15fr_480px]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-center xl:p-14">
        <div className="hero-orb left-[-10%] top-[-10%] h-96 w-96 bg-indigo-600" />
        <div className="hero-orb bottom-[-15%] right-[-5%] h-96 w-96 bg-emerald-500" style={{ animationDelay: "-5s" }} />
        <div className="hero-orb right-[30%] top-[30%] h-64 w-64 bg-violet-600" style={{ animationDelay: "-9s" }} />

        <div className="relative z-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-200 backdrop-blur-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            Secure · AI-powered · Role-based
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl"
          >
            Exams, reimagined
            <span className="text-gradient-animated block">for every classroom.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-5 text-lg leading-relaxed text-slate-300">
            Create, proctor and grade online examinations in one place — built for administrators, faculty and students.
          </motion.p>
        </div>

        <div className="relative z-0 my-6 overflow-hidden rounded-3xl">
          <Hero3D />
        </div>

        <div className="relative z-10 grid max-w-2xl gap-3 xl:grid-cols-3">
          {features.map(({ icon: Icon, title, text, color }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.08 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className={cn("mb-2 grid h-8 w-8 place-items-center rounded-lg", color)}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-0.5 text-xs text-slate-400">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative flex items-center justify-center p-4 sm:p-8">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">OES Pro</p>
              <p className="text-xs text-muted-foreground">Online Examination System</p>
            </div>
          </div>

          <div className="relative -mb-6 flex items-end justify-center gap-1">
            <Suspense fallback={<div className="h-[138px]" />}>
              <Mascot3D mood={loading || notice?.tone === "error" ? "think" : "wave"} talking={loading} size={120} />
            </Suspense>
            <motion.div
              key={mode}
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="mb-16 max-w-[190px] rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-2 text-xs shadow-lg"
            >
              {mode === "login" ? "Hi, I'm Ava! Sign in and I'll guide you around." : "Welcome! Create your account and I'll show you the ropes."}
            </motion.div>
          </div>
          <TiltCard maxTilt={4} className="glow-border">
            <form onSubmit={submit} className="grid gap-4 p-6 sm:p-8">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === "login" ? "Sign in to your admin, faculty or student workspace." : "Students and faculty can register here."}
                </p>
              </div>

              <div className="relative grid grid-cols-2 rounded-lg bg-muted p-1">
                {(["login", "register"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setMode(item);
                      setNotice(null);
                    }}
                    className="relative z-10 rounded-md py-2 text-sm font-medium capitalize"
                  >
                    {mode === item && <motion.span layoutId="auth-tab" className="absolute inset-0 -z-10 rounded-md bg-background shadow-sm" />}
                    {item}
                  </button>
                ))}
              </div>

              {mode === "register" && (
                <div className="grid grid-cols-2 gap-2">
                  {(["student", "faculty"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={cn(
                        "flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border text-sm capitalize transition-colors",
                        role === item && "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200"
                      )}
                      onClick={() => setRole(item)}
                    >
                      {item === "student" ? <GraduationCap className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                      {item}
                    </button>
                  ))}
                </div>
              )}

              <label className="grid gap-1.5 text-sm font-medium">
                Username
                <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter username" autoComplete="username" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Password
                <div className="relative">
                  <Input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "register" && (
                  <span className="text-xs font-normal text-muted-foreground">At least 8 characters with upper & lower case, a number and a symbol.</span>
                )}
              </label>

              {mode === "register" && role === "faculty" && (
                <label className="grid gap-1.5 text-sm font-medium">
                  Department
                  <Input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Computer Science" />
                </label>
              )}
              {mode === "register" && role === "student" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Semester
                    <Input value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="5" inputMode="numeric" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium">
                    Program
                    <Input value={major} onChange={(event) => setMajor(event.target.value)} placeholder="B.Tech CSE" />
                  </label>
                </div>
              )}

              <NoticeBanner notice={notice} />

              <Button type="submit" variant="premium" size="default" disabled={loading || !username || !password}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {mode === "login" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </TiltCard>
          <p className="mt-6 text-center text-xs text-muted-foreground">Administrator accounts are created by an existing administrator.</p>
        </motion.div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

function AdminWorkspace({ session, activeView }: { session: UserSession; activeView: string }) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<Row[]>([]);
  const [results, setResults] = useState<Row[]>([]);
  const [attempts, setAttempts] = useState<Row[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [sqlQuery, setSqlQuery] = useState("SELECT user_id, username, role, created_at FROM users LIMIT 20;");
  const [sqlResult, setSqlResult] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      const [overviewData, usersData, attemptsData, resultsData, tablesData] = await Promise.all([
        api<{ success: boolean; data: AdminOverview }>("/api/admin/overview", {}, session.token),
        api<{ success: boolean; data: { users: Row[] } }>("/api/admin/users", {}, session.token),
        api<{ success: boolean; attempts: Row[] }>("/api/attempts/all", {}, session.token),
        api<{ success: boolean; results: Row[] }>("/api/results/all", {}, session.token),
        api<{ success: boolean; data: { tables: string[] } }>("/api/tables", {}, session.token)
      ]);
      setOverview(overviewData.data);
      setUsers(usersData.data.users || []);
      setAttempts(attemptsData.attempts || []);
      setResults(resultsData.results || []);
      setTables(tablesData.data.tables || []);
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "Could not load admin data") });
    }
  }

  async function runSqlQuery() {
    setRunning(true);
    try {
      const data = await api<{ success: boolean; data: { rows: Row[] } }>("/api/query", {
        method: "POST",
        body: JSON.stringify({ sql: sqlQuery })
      }, session.token);
      const rows = Array.isArray(data.data.rows) ? data.data.rows : [];
      setSqlResult(rows);
      setNotice({ tone: "success", text: `Query executed. ${rows.length} row${rows.length === 1 ? "" : "s"} returned.` });
    } catch (error) {
      setSqlResult([]);
      setNotice({ tone: "error", text: errorText(error, "Query execution failed") });
    } finally {
      setRunning(false);
    }
  }

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          (roleFilter === "all" || user.role === roleFilter) &&
          String(user.username).toLowerCase().includes(userSearch.trim().toLowerCase())
      ),
    [users, roleFilter, userSearch]
  );

  if (activeView === "users") {
    return (
      <ViewFade viewKey="users">
        <div className="grid gap-6">
          <NoticeBanner notice={notice} />
          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  User Directory
                </CardTitle>
                <CardDescription>{filteredUsers.length} of {users.length} accounts</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search username" className="h-10 min-h-0 w-48 pl-9" />
                </div>
                {(["all", "student", "faculty", "admin"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setRoleFilter(item)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs capitalize transition-colors",
                      roleFilter === item ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                rows={filteredUsers}
                columns={[
                  { key: "user_id", label: "ID" },
                  { key: "username", label: "Username", render: (row) => <span className="font-medium">{String(row.username)}</span> },
                  { key: "role", label: "Role", render: (row) => <Badge tone={ROLE_TONE[row.role as Role] ?? "neutral"}>{String(row.role)}</Badge> },
                  { key: "created_at", label: "Joined" }
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Exam Results ({results.length})
              </CardTitle>
              <CardDescription>Every graded attempt in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                rows={results}
                columns={[
                  { key: "student_name", label: "Student" },
                  { key: "exam_title", label: "Exam" },
                  { key: "total_marks", label: "Marks", render: (row) => <span className="font-semibold">{Number(row.total_marks)}</span> },
                  { key: "is_published", label: "Status", render: (row) => (row.is_published ? <Badge tone="emerald">Published</Badge> : <Badge>Draft</Badge>) },
                  { key: "submitted_at", label: "Submitted" }
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </ViewFade>
    );
  }

  if (activeView === "database") {
    return (
      <ViewFade viewKey="database">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-500" />
                SQL Console
              </CardTitle>
              <CardDescription>Run read-only queries (SELECT, SHOW, DESCRIBE, EXPLAIN). Press Ctrl + Enter to execute.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <textarea
                className="min-h-36 w-full rounded-lg border border-input bg-slate-950 p-4 font-mono text-sm text-emerald-300 outline-none focus:ring-2 focus:ring-ring"
                placeholder="SELECT * FROM examination LIMIT 10;"
                spellCheck={false}
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runSqlQuery();
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="premium" onClick={runSqlQuery} disabled={running || !sqlQuery.trim()}>
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Execute
                </Button>
                {tables.map((table) => (
                  <Button key={table} variant="outline" size="sm" className="h-11 font-mono text-xs" onClick={() => setSqlQuery(`SELECT * FROM ${table} LIMIT 20;`)}>
                    {table}
                  </Button>
                ))}
              </div>
              <NoticeBanner notice={notice} />
            </CardContent>
          </Card>

          {sqlResult.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Results ({sqlResult.length} rows)</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable rows={sqlResult} columns={Object.keys(sqlResult[0]).map((key) => ({ key, label: key }))} />
              </CardContent>
            </Card>
          )}
        </div>
      </ViewFade>
    );
  }

  return (
    <ViewFade viewKey="dashboard">
      <div className="grid gap-6">
        <NoticeBanner notice={notice} />
        {overview ? (
          <AdminAnalytics overview={overview} />
        ) : (
          !notice && (
            <div className="grid place-items-center py-24 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest exam attempts across the institution</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <EmptyState icon={Activity} title="No activity yet" />
            ) : (
              <DataTable
                rows={attempts.slice(0, 10)}
                columns={[
                  { key: "student_name", label: "Student" },
                  { key: "exam_title", label: "Exam" },
                  { key: "status", label: "Status", render: (row) => <Badge tone={row.status === "ONGOING" ? "amber" : "emerald"}>{String(row.status)}</Badge> },
                  { key: "start_time", label: "Started" },
                  { key: "end_time", label: "Finished" }
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ViewFade>
  );
}

/* ------------------------------------------------------------------ */
/* Faculty                                                             */
/* ------------------------------------------------------------------ */

const EMPTY_QUESTION = {
  content: "",
  difficulty_level: "MEDIUM",
  subject_topic: "",
  tags: "",
  correct_answer: "A",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: ""
};

type VoiceField = "content" | "option_a" | "option_b" | "option_c" | "option_d";

function FacultyWorkspace({ session, activeView }: { session: UserSession; activeView: string }) {
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION);
  const [examForm, setExamForm] = useState({ title: "", duration_minutes: "30", scheduled_time: "" });
  const [assignForm, setAssignForm] = useState({ exam_id: "", question_id: "", student_user_id: "" });
  const [questions, setQuestions] = useState<Row[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Row[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [recordingField, setRecordingField] = useState<VoiceField | null>(null);
  const recordingFieldRef = useRef<VoiceField | null>(null);
  const recognitionRef = useRef<any>(null);
  const [questionMode, setQuestionMode] = useState<"manual" | "ai">("manual");
  const [monitorExamId, setMonitorExamId] = useState("");

  useEffect(() => {
    loadFacultyData();

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    // Read the target field from a ref: these handlers are created once,
    // so reading state here would always see the initial (null) value
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const field = recordingFieldRef.current;
      if (field) {
        setQuestionForm((prev) => ({ ...prev, [field]: prev[field] ? `${prev[field]} ${transcript}` : transcript }));
      }
    };
    recognition.onerror = () => setNotice({ tone: "error", text: "Voice recognition error. Please try again." });
    recognition.onend = () => {
      recordingFieldRef.current = null;
      setRecordingField(null);
    };
    recognitionRef.current = recognition;

    return () => recognition.abort();
  }, []);

  async function loadFacultyData() {
    try {
      const [q, e, a] = await Promise.all([
        api<{ success: boolean; questions: Row[] }>("/api/questions/all", {}, session.token),
        api<{ success: boolean; exams: Exam[] }>("/api/exams/all", {}, session.token),
        api<{ success: boolean; attempts: Row[] }>("/api/attempts/all", {}, session.token)
      ]);
      const myExams = (e.exams || []).filter((item) => Number(item.faculty_user_id) === session.user.user_id);
      const myExamIds = new Set(myExams.map((exam) => Number(exam.exam_id)));
      setQuestions((q.questions || []).filter((item) => Number(item.faculty_user_id) === session.user.user_id));
      setExams(myExams);
      setAttempts((a.attempts || []).filter((attempt) => myExamIds.has(Number(attempt.exam_id))));
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "Could not load faculty data") });
    }
  }

  function toggleVoice(field: VoiceField) {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setNotice({ tone: "warning", text: "Voice input is not supported in this browser. Try Chrome or Edge." });
      return;
    }
    if (recordingFieldRef.current) {
      recognition.stop();
      return;
    }
    recordingFieldRef.current = field;
    setRecordingField(field);
    recognition.start();
  }

  async function addQuestion() {
    setSaving(true);
    try {
      const result = await api<{ success: boolean; message: string; data: { question_id: number } }>("/api/questions/add", {
        method: "POST",
        body: JSON.stringify({ ...questionForm, question_type: "MCQ" })
      }, session.token);
      setNotice({ tone: "success", text: `${result.message}. Question ID: ${result.data.question_id}` });
      setQuestionForm(EMPTY_QUESTION);
      await loadFacultyData();
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "Could not add question") });
    } finally {
      setSaving(false);
    }
  }

  async function createExam() {
    setSaving(true);
    try {
      const result = await api<{ success: boolean; message: string; data: { exam_id: number } }>("/api/exams/create", {
        method: "POST",
        body: JSON.stringify({
          title: examForm.title,
          duration_minutes: Number(examForm.duration_minutes),
          scheduled_time: examForm.scheduled_time
        })
      }, session.token);
      setAssignForm((current) => ({ ...current, exam_id: String(result.data.exam_id) }));
      setExamForm({ title: "", duration_minutes: "30", scheduled_time: "" });
      setNotice({ tone: "success", text: `${result.message}. Exam ID: ${result.data.exam_id} — now attach questions below.` });
      await loadFacultyData();
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "Could not create exam") });
    } finally {
      setSaving(false);
    }
  }

  async function assignQuestion() {
    try {
      const result = await api<{ success: boolean; message: string }>("/api/exam-questions/assign", {
        method: "POST",
        body: JSON.stringify({ exam_id: assignForm.exam_id, question_id: assignForm.question_id })
      }, session.token);
      setNotice({ tone: "success", text: result.message });
      setAssignForm((current) => ({ ...current, question_id: "" }));
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "Could not assign question") });
    }
  }

  async function assignStudent() {
    try {
      const result = await api<{ success: boolean; message: string }>("/api/student-exams/assign", {
        method: "POST",
        body: JSON.stringify({ exam_id: assignForm.exam_id, student_user_id: assignForm.student_user_id })
      }, session.token);
      setNotice({ tone: "success", text: result.message });
      setAssignForm((current) => ({ ...current, student_user_id: "" }));
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "Could not assign student") });
    }
  }

  const selectClass = "min-h-11 w-full rounded-md border border-input bg-background/70 px-3 text-sm";

  if (activeView === "exams") {
    return (
      <ViewFade viewKey="exams">
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="grid content-start gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-violet-500" />
                  Create Exam
                </CardTitle>
                <CardDescription>Set the title, duration and schedule</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Input placeholder="Exam title (e.g., DBMS Final Exam)" value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} />
                <label className="grid gap-1 text-xs font-medium">
                  Duration (minutes)
                  <Input type="number" min={1} max={300} value={examForm.duration_minutes} onChange={(e) => setExamForm({ ...examForm, duration_minutes: e.target.value })} />
                </label>
                <label className="grid gap-1 text-xs font-medium">
                  Scheduled time
                  <Input type="datetime-local" value={examForm.scheduled_time} onChange={(e) => setExamForm({ ...examForm, scheduled_time: e.target.value })} />
                </label>
                <Button variant="premium" onClick={createExam} disabled={saving || !examForm.title || !examForm.scheduled_time || !Number(examForm.duration_minutes)}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create Exam
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Build & Assign</CardTitle>
                <CardDescription>Attach questions and assign students. Exams with no assigned students are open to all students.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <label className="grid gap-1 text-xs font-medium">
                  Exam
                  <select className={selectClass} value={assignForm.exam_id} onChange={(e) => setAssignForm({ ...assignForm, exam_id: e.target.value })}>
                    <option value="">Select an exam</option>
                    {exams.map((exam) => (
                      <option key={exam.exam_id} value={exam.exam_id}>
                        #{exam.exam_id} · {exam.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <select className={selectClass} value={assignForm.question_id} onChange={(e) => setAssignForm({ ...assignForm, question_id: e.target.value })}>
                    <option value="">Select a question</option>
                    {questions.map((question) => (
                      <option key={String(question.question_id)} value={String(question.question_id)}>
                        #{String(question.question_id)} · {stripHtml(String(question.content)).slice(0, 60)}
                      </option>
                    ))}
                  </select>
                  <Button variant="outline" onClick={assignQuestion} disabled={!assignForm.exam_id || !assignForm.question_id}>
                    <Plus className="h-4 w-4" />
                    Attach
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input placeholder="Student ID" inputMode="numeric" value={assignForm.student_user_id} onChange={(e) => setAssignForm({ ...assignForm, student_user_id: e.target.value })} />
                  <Button variant="outline" onClick={assignStudent} disabled={!assignForm.exam_id || !assignForm.student_user_id}>
                    <User className="h-4 w-4" />
                    Assign
                  </Button>
                </div>
              </CardContent>
            </Card>

            <NoticeBanner notice={notice} />
          </div>

          <div className="grid content-start gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">My Exams</h2>
              <span className="text-sm text-muted-foreground">{exams.length} total</span>
            </div>
            {exams.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No exams created yet" hint="Create your first exam using the form." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {exams.map((exam, index) => {
                  const examAttempts = attempts.filter((attempt) => Number(attempt.exam_id) === exam.exam_id);
                  const upcoming = exam.scheduled_time && new Date(exam.scheduled_time) > new Date();
                  return (
                    <motion.div key={exam.exam_id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                      <TiltCard glow="139 92 246" className="h-full cursor-pointer" onClick={() => setAssignForm((current) => ({ ...current, exam_id: String(exam.exam_id) }))}>
                        <div className="flex h-full flex-col gap-3 p-5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Exam #{exam.exam_id}</span>
                            <Badge tone={upcoming ? "violet" : "neutral"}>{upcoming ? "Upcoming" : "Scheduled"}</Badge>
                          </div>
                          <p className="text-base font-semibold leading-snug">{exam.title}</p>
                          <div className="mt-auto grid gap-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {exam.duration_minutes} minutes</span>
                            <span className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> {formatDate(exam.scheduled_time)}</span>
                            <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {examAttempts.length} attempt{examAttempts.length === 1 ? "" : "s"}</span>
                          </div>
                          {assignForm.exam_id === String(exam.exam_id) && <Badge tone="indigo">Selected for building</Badge>}
                        </div>
                      </TiltCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ViewFade>
    );
  }

  if (activeView === "generator") {
    return (
      <ViewFade viewKey="generator">
        <TestGenerator token={session.token} onChanged={loadFacultyData} />
      </ViewFade>
    );
  }

  if (activeView === "monitoring") {
    return (
      <ViewFade viewKey="monitoring">
        <div className="grid gap-6">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 pt-5">
              <Activity className="h-5 w-5 text-indigo-500" />
              <span className="text-sm font-medium">Monitor exam</span>
              <select className={cn(selectClass, "w-auto min-w-64 flex-1 sm:flex-none")} value={monitorExamId} onChange={(e) => setMonitorExamId(e.target.value)}>
                <option value="">Select an exam to watch live</option>
                {exams.map((exam) => (
                  <option key={exam.exam_id} value={exam.exam_id}>
                    #{exam.exam_id} · {exam.title}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
          {monitorExamId ? (
            <FacultyMonitoring key={monitorExamId} examId={Number(monitorExamId)} facultyId={session.user.user_id} />
          ) : (
            <EmptyState icon={Eye} title="Pick an exam to start live monitoring" hint="Students currently taking it will appear with real-time proctoring alerts." />
          )}
          <NoticeBanner notice={notice} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                Attempts on My Exams
              </CardTitle>
              <CardDescription>Every attempt students have made on exams you created</CardDescription>
            </CardHeader>
            <CardContent>
              {attempts.length === 0 ? (
                <EmptyState icon={Activity} title="No student attempts yet" hint="Attempts will appear here once students start taking your exams." />
              ) : (
                <DataTable
                  rows={attempts}
                  columns={[
                    { key: "student_name", label: "Student" },
                    { key: "exam_title", label: "Exam" },
                    { key: "status", label: "Status", render: (row) => <Badge tone={row.status === "ONGOING" ? "amber" : "emerald"}>{String(row.status)}</Badge> },
                    { key: "start_time", label: "Started" },
                    { key: "end_time", label: "Finished" }
                  ]}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </ViewFade>
    );
  }

  // Question bank (default)
  return (
    <ViewFade viewKey="questions">
      <div className="grid gap-6">
        <div className="relative grid grid-cols-2 rounded-xl border border-border bg-card/60 p-1 backdrop-blur">
          {(["manual", "ai"] as const).map((item) => (
            <button key={item} onClick={() => setQuestionMode(item)} className="relative z-10 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium">
              {questionMode === item && <motion.span layoutId="question-mode" className="absolute inset-0 -z-10 rounded-lg bg-background shadow-sm" />}
              {item === "manual" ? <FileQuestion className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-amber-500" />}
              {item === "manual" ? "Manual Creation" : "AI Co-Pilot"}
            </button>
          ))}
        </div>

        {questionMode === "ai" && <AICoPilot token={session.token} facultyUserId={session.user.user_id} onQuestionsSaved={loadFacultyData} />}

        {questionMode === "manual" && (
          <>
            <QuestionImport
              onImport={async (imported) => {
                let saved = 0;
                const failures: string[] = [];
                for (const q of imported) {
                  try {
                    await api("/api/questions/add", {
                      method: "POST",
                      body: JSON.stringify({
                        content: q.content,
                        question_type: "MCQ",
                        correct_answer: q.correct_answer,
                        option_a: q.option_a,
                        option_b: q.option_b,
                        option_c: q.option_c,
                        option_d: q.option_d,
                        difficulty_level: String(q.difficulty_level || "MEDIUM").toUpperCase(),
                        subject_topic: q.subject_topic,
                        tags: q.tags
                      })
                    }, session.token);
                    saved++;
                  } catch (error) {
                    failures.push(errorText(error, "failed"));
                  }
                }
                await loadFacultyData();
                setNotice(
                  failures.length
                    ? { tone: "warning", text: `Imported ${saved} of ${imported.length} questions. First error: ${failures[0]}` }
                    : { tone: "success", text: `Imported ${saved} questions successfully.` }
                );
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="h-5 w-5 text-indigo-500" />
                  Create Auto-Evaluated MCQ
                </CardTitle>
                <CardDescription>Use the rich text editor or the microphone buttons for voice input.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="relative">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium">Question</label>
                    <VoiceButton active={recordingField === "content"} onClick={() => toggleVoice("content")} />
                  </div>
                  <RichTextEditor
                    value={questionForm.content}
                    onChange={(value) => setQuestionForm((prev) => ({ ...prev, content: value }))}
                    placeholder="Enter your question (supports formatting, math and images)..."
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(["option_a", "option_b", "option_c", "option_d"] as const).map((option, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isCorrect = questionForm.correct_answer === letter;
                    return (
                      <div key={option} className="relative">
                        <button
                          type="button"
                          title="Mark as correct answer"
                          onClick={() => setQuestionForm((prev) => ({ ...prev, correct_answer: letter }))}
                          className={cn(
                            "absolute left-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-xs font-bold transition-colors",
                            isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:bg-emerald-500/20"
                          )}
                        >
                          {letter}
                        </button>
                        <Input
                          placeholder={`Option ${letter}`}
                          value={questionForm[option]}
                          onChange={(e) => setQuestionForm((prev) => ({ ...prev, [option]: e.target.value }))}
                          className={cn("pl-11 pr-11", isCorrect && "border-emerald-500/60")}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <VoiceButton small active={recordingField === option} onClick={() => toggleVoice(option)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="-mt-2 text-xs text-muted-foreground">Click a letter to mark the correct answer (currently {questionForm.correct_answer}).</p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="grid gap-1 text-xs font-medium">
                    Difficulty
                    <select className={selectClass} value={questionForm.difficulty_level} onChange={(e) => setQuestionForm({ ...questionForm, difficulty_level: e.target.value })}>
                      {["EASY", "MEDIUM", "HARD"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-medium">
                    Subject / topic
                    <Input value={questionForm.subject_topic} onChange={(e) => setQuestionForm({ ...questionForm, subject_topic: e.target.value })} />
                  </label>
                  <label className="grid gap-1 text-xs font-medium">
                    Tags
                    <Input value={questionForm.tags} onChange={(e) => setQuestionForm({ ...questionForm, tags: e.target.value })} />
                  </label>
                </div>

                <NoticeBanner notice={notice} />

                <Button
                  variant="premium"
                  onClick={addQuestion}
                  disabled={saving || !stripHtml(questionForm.content).trim() || !questionForm.option_a || !questionForm.option_b || !questionForm.option_c || !questionForm.option_d}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Question to Bank
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>My Question Bank ({questions.length})</CardTitle>
            <CardDescription>Questions you've created for examinations</CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <EmptyState icon={FileQuestion} title="No questions created yet" hint={questionMode === "manual" ? "Create your first MCQ above." : "Generate questions with the AI Co-Pilot."} />
            ) : (
              <DataTable
                rows={questions}
                columns={[
                  { key: "question_id", label: "ID" },
                  { key: "content", label: "Question" },
                  { key: "difficulty_level", label: "Difficulty", render: (row) => <Badge tone={DIFFICULTY_TONE[row.difficulty_level as keyof typeof DIFFICULTY_TONE] ?? "neutral"}>{String(row.difficulty_level)}</Badge> },
                  { key: "correct_answer", label: "Answer", render: (row) => <Badge tone="emerald">{String(row.correct_answer)}</Badge> },
                  { key: "subject_topic", label: "Topic" },
                  { key: "created_at", label: "Created" }
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ViewFade>
  );
}

function VoiceButton({ active, onClick, small }: { active: boolean; onClick: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "Stop voice input" : "Start voice input"}
      className={cn(
        "rounded-full transition-colors",
        small ? "p-1.5" : "p-2",
        active ? "animate-pulse bg-red-500 text-white" : "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-300"
      )}
    >
      {active ? <MicOff className={small ? "h-3 w-3" : "h-4 w-4"} /> : <Mic className={small ? "h-3 w-3" : "h-4 w-4"} />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Student                                                             */
/* ------------------------------------------------------------------ */

type ActiveExam = {
  attemptId: number;
  examId: number;
  title: string;
  duration: number;
  startTime: Date;
  questions: Question[];
};

function StudentWorkspace({
  session,
  activeView,
  onNavigate,
  onLockNavigation
}: {
  session: UserSession;
  activeView: string;
  onNavigate: (view: string) => void;
  onLockNavigation: (locked: boolean) => void;
}) {
  const [studentId, setStudentId] = useState(String(session.user.user_id));
  const [verified, setVerified] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeExam, setActiveExam] = useState<ActiveExam | null>(null);
  const [proctorStarted, setProctorStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showCalculator, setShowCalculator] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [lastResult, setLastResult] = useState<{ title: string; score: number; total: number; attemptId: number } | null>(null);
  const [results, setResults] = useState<Row[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [startingExamId, setStartingExamId] = useState<number | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    loadResults();
  }, []);

  useEffect(() => {
    onLockNavigation(Boolean(activeExam));
  }, [activeExam, onLockNavigation]);

  async function loadExams() {
    const data = await api<{ success: boolean; exams: Exam[] }>(`/api/student-exams/${session.user.user_id}`, {}, session.token);
    setExams(data.exams || []);
    return data.exams || [];
  }

  async function loadResults() {
    try {
      const data = await api<{ success: boolean; results: Row[] }>(`/api/results/student/${session.user.user_id}`, {}, session.token);
      setResults(data.results || []);
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "Could not load results") });
    }
  }

  async function verifyStudentId(event: FormEvent) {
    event.preventDefault();
    if (Number(studentId) !== session.user.user_id) {
      setVerified(false);
      setNotice({ tone: "error", text: "Student ID does not match your logged-in account." });
      return;
    }
    try {
      const list = await loadExams();
      setVerified(true);
      setNotice({ tone: "success", text: list.length ? `Identity verified. ${list.length} exam(s) available.` : "Identity verified. No exams assigned yet — contact your instructor." });
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "Could not verify student ID") });
    }
  }

  async function startExam(exam: Exam) {
    setStartingExamId(exam.exam_id);
    setNotice(null);
    try {
      const started = await api<{ success: boolean; attempt_id: number; start_time: string; message: string }>("/api/attempts/start", {
        method: "POST",
        body: JSON.stringify({ exam_id: exam.exam_id })
      }, session.token);
      const paper = await api<{ success: boolean; exam: { title: string; duration: number }; questions: Question[] }>(`/api/exams/paper/${exam.exam_id}`, {}, session.token);
      if (!paper.questions?.length) {
        throw new Error("This exam has no questions yet.");
      }
      submittingRef.current = false;
      setAnswers({});
      setCurrentIndex(0);
      setBookmarks([]);
      setConfirmSubmit(false);
      setLastResult(null);
      setProctorStarted(false);
      setActiveExam({
        attemptId: started.attempt_id,
        examId: exam.exam_id,
        title: paper.exam.title,
        duration: paper.exam.duration,
        // Resumed attempts keep their original start time so the timer is accurate
        startTime: started.start_time ? new Date(started.start_time) : new Date(),
        questions: paper.questions
      });
    } catch (error) {
      setNotice({ tone: "error", text: errorText(error, "Could not start exam") });
    } finally {
      setStartingExamId(null);
    }
  }

  async function markAnswer(questionId: number, answer: string) {
    if (!activeExam) return;
    const previous = answers[questionId];
    setAnswers((current) => ({ ...current, [questionId]: answer }));
    try {
      await api("/api/student-answers/save", {
        method: "POST",
        body: JSON.stringify({ attempt_id: activeExam.attemptId, question_id: questionId, selected_answer: answer })
      }, session.token);
    } catch (error) {
      // Roll back the optimistic selection so the UI never shows an unsaved answer
      setAnswers((current) => {
        const next = { ...current };
        if (previous) next[questionId] = previous;
        else delete next[questionId];
        return next;
      });
      setNotice({ tone: "error", text: errorText(error, "Could not save answer") });
    }
  }

  const submitExam = useCallback(async () => {
    if (!activeExam || submittingRef.current) return;
    submittingRef.current = true;
    try {
      const data = await api<{ success: boolean; score: number; total_questions: number; message: string }>("/api/attempts/submit", {
        method: "POST",
        body: JSON.stringify({ attempt_id: activeExam.attemptId })
      }, session.token);
      setLastResult({ title: activeExam.title, score: Number(data.score), total: Number(data.total_questions), attemptId: activeExam.attemptId });
      setActiveExam(null);
      setShowCalculator(false);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
      await Promise.all([loadResults(), loadExams()]);
    } catch (error) {
      submittingRef.current = false;
      setNotice({ tone: "error", text: errorText(error, "Could not submit exam") });
    }
  }, [activeExam, session.token]);

  // Keyboard shortcuts while answering: A-D selects, arrow keys move between questions
  useEffect(() => {
    if (!activeExam || !proctorStarted) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      const question = activeExam.questions[currentIndex];
      const key = event.key.toUpperCase();
      if (["A", "B", "C", "D"].includes(key) && question?.options?.[key as "A"]) {
        markAnswer(question.question_id, key);
      } else if (event.key === "ArrowRight") {
        setCurrentIndex((index) => Math.min(index + 1, activeExam.questions.length - 1));
      } else if (event.key === "ArrowLeft") {
        setCurrentIndex((index) => Math.max(index - 1, 0));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---------- Exam in progress (wrapped by the proctoring shell) ----------
  if (activeExam) {
    const question = activeExam.questions[currentIndex];
    const answeredIds = Object.keys(answers).map(Number);
    const unanswered = activeExam.questions.length - answeredIds.length;
    const progress = (answeredIds.length / activeExam.questions.length) * 100;

    return (
      <ProctoredExam
        examId={activeExam.examId}
        studentId={session.user.user_id}
        attemptId={activeExam.attemptId}
        onExamStart={() => setProctorStarted(true)}
        onExamEnd={submitExam}
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="overflow-hidden">
            <div className="h-1 bg-muted">
              <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400" animate={{ width: `${progress}%` }} />
            </div>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">{activeExam.title}</CardTitle>
                <CardDescription>
                  Question {currentIndex + 1} of {activeExam.questions.length} · {answeredIds.length} answered · answers save automatically
                </CardDescription>
              </div>
              <ExamTimer
                durationMinutes={activeExam.duration}
                startTime={activeExam.startTime}
                onTimeUp={submitExam}
                onWarning={(mins) => setNotice({ tone: "warning", text: `${mins} minutes remaining!` })}
              />
            </CardHeader>
            <CardContent className="grid gap-6">
              <AnimatePresence mode="wait">
                {question && (
                  <motion.div
                    key={question.question_id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-border p-5 sm:p-6"
                  >
                    <div className="mb-5 flex gap-3 text-base font-medium sm:text-lg">
                      <span className="shrink-0 text-indigo-600 dark:text-indigo-400">Q{currentIndex + 1}.</span>
                      <RichContent html={question.content} />
                    </div>
                    <div className="grid gap-3">
                      {(["A", "B", "C", "D"] as const).map((key) => {
                        const text = question.options?.[key];
                        if (!text) return null;
                        const selected = answers[question.question_id] === key;
                        return (
                          <button
                            key={key}
                            onClick={() => markAnswer(question.question_id, key)}
                            className={cn(
                              "group flex items-center gap-3 rounded-xl border p-4 text-left text-sm transition-all",
                              selected
                                ? "border-indigo-500 bg-indigo-500/10 font-medium text-indigo-700 shadow-[0_0_0_3px_rgb(99_102_241/0.15)] dark:text-indigo-200"
                                : "border-border bg-background hover:-translate-y-0.5 hover:border-indigo-500/40 hover:shadow-md"
                            )}
                          >
                            <span
                              className={cn(
                                "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold transition-colors",
                                selected ? "bg-indigo-500 text-white" : "bg-muted text-muted-foreground group-hover:bg-indigo-500/15"
                              )}
                            >
                              {key}
                            </span>
                            {text}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))} disabled={currentIndex === 0}>
                    <ArrowLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentIndex((i) => Math.min(i + 1, activeExam.questions.length - 1))} disabled={currentIndex === activeExam.questions.length - 1}>
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="premium"
                  onClick={() => {
                    if (unanswered > 0 && !confirmSubmit) {
                      setConfirmSubmit(true);
                      return;
                    }
                    submitExam();
                  }}
                >
                  <Save className="h-4 w-4" />
                  {confirmSubmit && unanswered > 0 ? `Submit with ${unanswered} unanswered?` : "Submit Exam"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Tip: press A–D to answer and ← → to move between questions.</p>
              <NoticeBanner notice={notice} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <QuestionNavigation
              questions={activeExam.questions}
              currentQuestionIndex={currentIndex}
              answeredQuestions={answeredIds}
              bookmarkedQuestions={bookmarks}
              onNavigate={setCurrentIndex}
              onToggleBookmark={(questionId) =>
                setBookmarks((prev) => (prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]))
              }
            />
            <Button variant="outline" className="w-full" onClick={() => setShowCalculator((value) => !value)}>
              <CalculatorIcon className="h-4 w-4" />
              {showCalculator ? "Hide" : "Show"} Calculator
            </Button>
          </div>
        </div>
        {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}
      </ProctoredExam>
    );
  }

  // ---------- ID verification ----------
  if (activeView === "verification") {
    return (
      <ViewFade viewKey="verification">
        <div className="mx-auto grid max-w-xl gap-6">
          <TiltCard glow="16 185 129" maxTilt={5}>
            <form onSubmit={verifyStudentId} className="grid gap-5 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Identity Verification</h2>
                  <p className="text-sm text-muted-foreground">Confirm your student ID to unlock your exams.</p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Account student ID</p>
                <p className="mt-1 font-mono text-3xl font-bold text-emerald-600 dark:text-emerald-400">{session.user.user_id}</p>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                Enter student ID
                <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} inputMode="numeric" className="font-mono text-lg" />
              </label>
              <Button type="submit" variant="premium">
                <ShieldCheck className="h-4 w-4" />
                Verify & Continue
              </Button>
              <NoticeBanner notice={notice} />
              {verified && (
                <Button type="button" variant="outline" onClick={() => onNavigate("exams")}>
                  Go to my exams <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </form>
          </TiltCard>
        </div>
      </ViewFade>
    );
  }

  // ---------- Exam list ----------
  if (activeView === "exams") {
    return (
      <ViewFade viewKey="exams">
        <div className="grid gap-6">
          {lastResult && <ResultCelebration result={lastResult} onDismiss={() => setLastResult(null)} onViewResults={() => onNavigate("results")} />}

          {!verified ? (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
                <p className="text-sm text-amber-700 dark:text-amber-200">Please verify your student ID before starting an exam.</p>
                <Button variant="outline" onClick={() => onNavigate("verification")}>
                  <ShieldCheck className="h-4 w-4" /> Verify now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <NoticeBanner notice={notice} />
              {exams.length === 0 ? (
                <EmptyState icon={GraduationCap} title="No exams available" hint="Your instructor hasn't assigned any exams yet." />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {exams.map((exam, index) => {
                    const completed = exam.attempt_status === "SUBMITTED" || exam.attempt_status === "AUTO_SUBMITTED";
                    const ongoing = exam.attempt_status === "ONGOING";
                    const noQuestions = !Number(exam.question_count);
                    return (
                      <motion.div key={exam.exam_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                        <TiltCard glow={completed ? "16 185 129" : "99 102 241"} className="h-full">
                          <div className="flex h-full flex-col gap-4 p-5">
                            <div className="flex items-start justify-between">
                              <div className={cn("grid h-11 w-11 place-items-center rounded-xl text-white shadow-lg", completed ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-indigo-500 to-violet-500")}>
                                {completed ? <CheckCircle2 className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                              </div>
                              {completed ? <Badge tone="emerald">Completed</Badge> : ongoing ? <Badge tone="amber">In progress</Badge> : <Badge tone="indigo">Available</Badge>}
                            </div>
                            <div>
                              <p className="text-base font-semibold leading-snug">{exam.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">Exam #{exam.exam_id}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="rounded-lg bg-muted/60 p-2.5">
                                <p className="text-muted-foreground">Duration</p>
                                <p className="mt-0.5 font-semibold">{exam.duration_minutes} min</p>
                              </div>
                              <div className="rounded-lg bg-muted/60 p-2.5">
                                <p className="text-muted-foreground">Questions</p>
                                <p className="mt-0.5 font-semibold">{exam.question_count ?? "—"}</p>
                              </div>
                            </div>
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarClock className="h-3.5 w-3.5" /> {formatDate(exam.scheduled_time)}
                            </p>
                            <Button
                              variant={completed ? "outline" : "premium"}
                              className="mt-auto"
                              disabled={completed || noQuestions || startingExamId !== null}
                              onClick={() => startExam(exam)}
                            >
                              {startingExamId === exam.exam_id ? <Loader2 className="h-4 w-4 animate-spin" /> : completed ? <CheckCircle2 className="h-4 w-4" /> : ongoing ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              {completed ? "Submitted" : noQuestions ? "No questions yet" : ongoing ? "Resume exam" : "Start exam"}
                            </Button>
                          </div>
                        </TiltCard>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </ViewFade>
    );
  }

  // ---------- Progress / gamification (computed from real results) ----------
  if (activeView === "progress") {
    const percents = results.map(percentOf);
    const totalCorrect = results.reduce((sum, row) => sum + Number(row.total_marks || 0), 0);
    const best = percents.length ? Math.max(...percents) : 0;
    const average = percents.length ? percents.reduce((a, b) => a + b, 0) / percents.length : 0;
    const points = Math.round(totalCorrect * 10 + percents.reduce((sum, p) => sum + p, 0));
    const submittedDays = new Set(results.map((row) => new Date(String(row.submitted_at)).toDateString()));
    let streak = 0;
    for (const day = new Date(); submittedDays.has(day.toDateString()); day.setDate(day.getDate() - 1)) streak++;

    return (
      <ViewFade viewKey="progress">
        <Gamification
          points={points}
          level={Math.floor(points / 250) + 1}
          streak={streak}
          achievements={[
            { id: "first", name: "First Steps", description: "Complete your first exam", icon: Star, unlocked: results.length >= 1, progress: Math.min(100, results.length * 100) },
            { id: "five", name: "Dedicated Learner", description: "Complete 5 exams", icon: Target, unlocked: results.length >= 5, progress: Math.min(100, (results.length / 5) * 100) },
            { id: "high", name: "High Achiever", description: "Keep an average score of 80%+", icon: Award, unlocked: results.length > 0 && average >= 80, progress: Math.min(100, (average / 80) * 100) },
            { id: "perfect", name: "Perfect Score", description: "Score 100% on any exam", icon: Trophy, unlocked: best >= 100, progress: best },
            { id: "master", name: "Question Master", description: "Answer 100 questions correctly", icon: Flame, unlocked: totalCorrect >= 100, progress: Math.min(100, totalCorrect) }
          ]}
        />
      </ViewFade>
    );
  }

  // ---------- Results (default for "results") ----------
  const average = results.length ? results.map(percentOf).reduce((a, b) => a + b, 0) / results.length : 0;
  return (
    <ViewFade viewKey="results">
      <div className="grid gap-6">
        {lastResult && <ResultCelebration result={lastResult} onDismiss={() => setLastResult(null)} />}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Exams completed", value: results.length, icon: CheckCircle2, glow: "16 185 129" },
            { label: "Average score", value: average, suffix: "%", decimals: 1, icon: Target, glow: "99 102 241" },
            { label: "Best score", value: results.length ? Math.max(...results.map(percentOf)) : 0, suffix: "%", decimals: 0, icon: Trophy, glow: "245 158 11" }
          ].map(({ label, value, suffix, decimals, icon: Icon, glow }) => (
            <TiltCard key={label} glow={glow}>
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-1 text-3xl font-bold">
                    <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />
                  </p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: `rgb(${glow} / 0.12)`, color: `rgb(${glow})` }}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </TiltCard>
          ))}
        </div>

        <NoticeBanner notice={notice} />

        {results.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No results yet" hint="Complete an exam to see your auto-evaluated results here." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((row, index) => (
              <motion.div key={String(row.result_id)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                <TiltCard glow="16 185 129" className="h-full">
                  <div className="flex items-center gap-5 p-5">
                    <ScoreRing percent={percentOf(row)} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{String(row.exam_title ?? `Exam #${row.exam_id}`)}</p>
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">{Number(row.total_marks)}</span>
                        <span className="text-muted-foreground"> / {Number(row.total_questions) || "—"} correct</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(row.submitted_at)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {row.is_published ? <Badge tone="emerald">Published</Badge> : <Badge>Provisional</Badge>}
                        <Button variant="soft" size="sm" onClick={() => openAvaReview(Number(row.attempt_id))}>
                          <Sparkles className="h-3.5 w-3.5" /> Review with Ava
                        </Button>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ViewFade>
  );
}

function ResultCelebration({ result, onDismiss, onViewResults }: { result: { title: string; score: number; total: number; attemptId: number }; onDismiss: () => void; onViewResults?: () => void }) {
  const percent = result.total ? (result.score / result.total) * 100 : 0;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }}>
      <TiltCard glow="16 185 129" className="glow-border">
        <div className="flex flex-wrap items-center gap-6 p-6">
          <ScoreRing percent={percent} size={112} label="score" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Exam submitted</p>
            <p className="mt-1 text-xl font-semibold">{result.title}</p>
            <p className="mt-1 text-muted-foreground">
              You answered <span className="font-semibold text-foreground">{result.score}</span> of {result.total} questions correctly.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="premium" onClick={() => openAvaReview(result.attemptId)}>
              <Sparkles className="h-4 w-4" /> Review with Ava
            </Button>
            {onViewResults && (
              <Button variant="outline" onClick={onViewResults}>
                View results
              </Button>
            )}
            <Button variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

export default App;
