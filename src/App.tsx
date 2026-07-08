import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Code2,
  Database,
  FileQuestion,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mic,
  MicOff,
  Moon,
  Play,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Users,
  Calculator as CalculatorIcon,
  Upload,
  TrendingUp,
  Trophy
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { cn } from "./lib/utils";

// Phase 1-6 Feature Components
import ProctoredExam from "./components/ProctoredExam";
import ExamTimer from "./components/ExamTimer";
import QuestionNavigation from "./components/QuestionNavigation";
import Calculator from "./components/Calculator";
import QuestionImport from "./components/QuestionImport";
import RichTextEditor from "./components/RichTextEditor";
import FacultyMonitoring from "./components/FacultyMonitoring";
import AdminAnalytics from "./components/AdminAnalytics";
import Gamification from "./components/Gamification";
import AICoPilot from "./components/AICoPilot";
import useAutoSave from "./hooks/useAutoSave";

type Role = "admin" | "faculty" | "student";

type UserSession = {
  token: string;
  user: {
    user_id: number;
    username: string;
    role: Role;
  };
};

type ApiResult = Record<string, unknown> & {
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
};

type Question = {
  question_id: number;
  content: string;
  question_type: string;
  options: Record<"A" | "B" | "C" | "D", string>;
};

const API = "";

async function api<T extends ApiResult>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = (await response.json().catch(() => ({}))) as T;

  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || `Request failed: ${response.status}`);
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

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      aria-label="Toggle theme"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative overflow-hidden"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

function App() {
  const [session, setSession] = useState<UserSession | null>(() => getStoredSession());
  const [activeView, setActiveView] = useState<string>(() => {
    const stored = getStoredSession();
    if (stored?.user.role === "student") return "verification";
    if (stored?.user.role === "faculty") return "questions";
    if (stored?.user.role === "admin") return "dashboard";
    return "dashboard";
  });

  function finishLogin(next: UserSession) {
    localStorage.setItem("oesToken", next.token);
    localStorage.setItem("oesUser", JSON.stringify(next.user));
    setSession(next);
  }

  function logout() {
    localStorage.removeItem("oesToken");
    localStorage.removeItem("oesUser");
    setSession(null);
  }

  if (!session) {
    return <AuthGate onLogin={finishLogin} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] border-r border-border bg-white/80 p-4 backdrop-blur-xl dark:bg-slate-900/80 lg:block">
          <div className="flex h-full flex-col gap-5">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card/70 p-3">
              <div className="grid h-11 w-11 place-items-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">OES Pro</p>
                <p className="text-xs text-muted-foreground">Role based examination system</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card/70 p-4">
              <p className="text-sm font-medium">{session.user.username}</p>
              <p className="text-xs capitalize text-muted-foreground">{session.user.role} workspace</p>
              <p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs">
                {session.user.role === "student" ? "Student ID" : session.user.role === "faculty" ? "Faculty ID" : "Admin ID"}: {session.user.user_id}
              </p>
            </div>

            <div className="grid gap-2 text-sm">
              {session.user.role === "admin" && (
                <>
                  <NavButton icon={LayoutDashboard} label="System monitoring" active={activeView === "dashboard"} onClick={() => setActiveView("dashboard")} />
                  <NavButton icon={Users} label="Users & Results" active={activeView === "users"} onClick={() => setActiveView("users")} />
                  <NavButton icon={Trophy} label="Gamification" active={activeView === "gamification"} onClick={() => setActiveView("gamification")} />
                  <NavButton icon={Database} label="Database Console" active={activeView === "database"} onClick={() => setActiveView("database")} />
                </>
              )}
              {session.user.role === "faculty" && (
                <>
                  <NavButton icon={FileQuestion} label="Question Bank" active={activeView === "questions"} onClick={() => setActiveView("questions")} />
                  <NavButton icon={ClipboardList} label="Exam Creation" active={activeView === "exams"} onClick={() => setActiveView("exams")} />
                  <NavButton icon={Activity} label="Student Monitoring" active={activeView === "monitoring"} onClick={() => setActiveView("monitoring")} />
                </>
              )}
              {session.user.role === "student" && (
                <>
                  <NavButton icon={ShieldCheck} label="ID Verification" active={activeView === "verification"} onClick={() => setActiveView("verification")} />
                  <NavButton icon={GraduationCap} label="Assigned Exams" active={activeView === "exams"} onClick={() => setActiveView("exams")} />
                  <NavButton icon={CheckCircle2} label="Auto-evaluated Result" active={activeView === "results"} onClick={() => setActiveView("results")} />
                </>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between rounded-lg border border-border bg-card/70 p-3">
              <ThemeToggle />
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/70 p-4 backdrop-blur-xl">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Online Examination System</p>
              <h1 className="text-2xl font-semibold tracking-normal">
                {session.user.role === "admin" && "Admin Control Center"}
                {session.user.role === "faculty" && "Faculty Exam Studio"}
                {session.user.role === "student" && "Student Exam Portal"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-border px-3 py-2 text-sm capitalize text-muted-foreground">
                {session.user.role}
              </span>
              <ThemeToggle />
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </header>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            {session.user.role === "admin" && <AdminWorkspace session={session} activeView={activeView} />}
            {session.user.role === "faculty" && <FacultyWorkspace session={session} activeView={activeView} />}
            {session.user.role === "student" && <StudentWorkspace session={session} activeView={activeView} />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: typeof Activity; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors",
        active 
          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function NavHint({ icon: Icon, label }: { icon: typeof Activity; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md px-3 py-2">
      <Icon className="h-4 w-4 text-indigo-500" />
      {label}
    </div>
  );
}

function AuthGate({ onLogin }: { onLogin: (session: UserSession) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [semester, setSemester] = useState("");
  const [major, setMajor] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage("");
    try {
      if (mode === "register") {
        const result = await api<{ success: boolean; message: string; data: { user_id: number } }>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            username,
            password,
            role,
            department,
            email,
            current_semester: semester ? Number(semester) : undefined,
            major_program: major
          })
        });
        setMessage(`${result.message}. Your database ID is ${result.data.user_id}. Use it in the student portal.`);
        setMode("login");
        return;
      }

      const result = await api<{ success: boolean; data: { token: string; user: UserSession["user"] } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      onLogin({ token: result.data.token, user: result.data.user });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-[1fr_460px]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.48),transparent_30%),radial-gradient(circle_at_80%_25%,rgba(16,185,129,0.26),transparent_28%),linear-gradient(135deg,#020617,#1e1b4b)]" />
        <div className="relative max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-200 backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4" />
            Enterprise-Grade Assessment Platform
          </div>
          <h1 className="text-6xl font-bold tracking-tight leading-tight">
            Online Examination
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
              System
            </span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-300">
            A comprehensive digital examination platform featuring role-based access control, 
            automated evaluation, and real-time performance analytics for academic institutions.
          </p>
          <div className="mt-8 grid gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1 grid h-8 w-8 place-items-center rounded-lg bg-indigo-500/20 text-indigo-300">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-white">Role-Based Administration</p>
                <p className="text-slate-400">Secure access control for administrators, faculty, and students</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-white">Automated Evaluation</p>
                <p className="text-slate-400">Instant grading with MCQ-based assessments and detailed analytics</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 grid h-8 w-8 place-items-center rounded-lg bg-violet-500/20 text-violet-300">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-white">Performance Tracking</p>
                <p className="text-slate-400">Comprehensive reporting and real-time examination monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{mode === "login" ? "Login to Continue" : "Create Account"}</CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Choose the credentials for admin, faculty, or student access."
                : "Register a role. Students receive a database ID for exam verification."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
              <button className={cn("rounded-md py-2 text-sm font-medium", mode === "login" && "bg-background shadow-sm")} onClick={() => setMode("login")}>
                Login
              </button>
              <button className={cn("rounded-md py-2 text-sm font-medium", mode === "register" && "bg-background shadow-sm")} onClick={() => setMode("register")}>
                Register
              </button>
            </div>

            {mode === "register" && (
              <div className="grid grid-cols-3 gap-2">
                {(["student", "faculty", "admin"] as Role[]).map((item) => (
                  <button
                    key={item}
                    className={cn("min-h-11 rounded-md border border-border text-sm capitalize", role === item && "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200")}
                    onClick={() => setRole(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            <label className="grid gap-2 text-sm font-medium">
              Username
              <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter username" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Password
              <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Enter password" />
            </label>

            {mode === "register" && role === "faculty" && (
              <label className="grid gap-2 text-sm font-medium">
                Department
                <Input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Computer Science" />
              </label>
            )}
            {mode === "register" && role === "admin" && (
              <label className="grid gap-2 text-sm font-medium">
                Admin Email
                <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@college.edu" />
              </label>
            )}
            {mode === "register" && role === "student" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Semester
                  <Input value={semester} onChange={(event) => setSemester(event.target.value)} placeholder="5" />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Program
                  <Input value={major} onChange={(event) => setMajor(event.target.value)} placeholder="B.Tech CSE" />
                </label>
              </div>
            )}

            {message && <div className="rounded-md border border-border bg-muted p-3 text-sm">{message}</div>}

            <Button variant="premium" onClick={submit} disabled={loading || !username || !password}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {mode === "login" ? "Login" : "Register"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function AdminWorkspace({ session, activeView }: { session: UserSession; activeView: string }) {
  const [stats, setStats] = useState({ users: 0, exams: 0, attempts: 0, results: 0 });
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [attempts, setAttempts] = useState<Record<string, unknown>[]>([]);
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users LIMIT 20;");
  const [sqlResult, setSqlResult] = useState<Record<string, unknown>[]>([]);
  const [message, setMessage] = useState("Loading system data...");

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      const [userCount, examCount, attemptsData, resultsData, usersData] = await Promise.all([
        countTable("users"),
        countTable("examination"),
        api<{ success: boolean; attempts: Record<string, unknown>[] }>("/api/attempts/all", {}, session.token),
        api<{ success: boolean; results: Record<string, unknown>[] }>("/api/results/all", {}, session.token),
        api<{ success: boolean; rows: Record<string, unknown>[] }>("/api/query", {
          method: "POST",
          body: JSON.stringify({ sql: "SELECT user_id, username, role, created_at FROM users ORDER BY created_at DESC LIMIT 50;" })
        }, session.token)
      ]);
      
      setStats({
        users: userCount,
        exams: examCount,
        attempts: attemptsData.attempts?.length || 0,
        results: resultsData.results?.length || 0
      });
      setAttempts(attemptsData.attempts || []);
      setResults(resultsData.results || []);
      setUsers(usersData.rows || []);
      setMessage("✓ System data loaded successfully");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load admin data");
    }
  }

  async function countTable(table: string) {
    const data = await api<{ success: boolean; rows: { count: number }[] }>("/api/query", {
      method: "POST",
      body: JSON.stringify({ sql: `SELECT COUNT(*) AS count FROM ${table};` })
    }, session.token);
    return Number(data.rows?.[0]?.count || 0);
  }

  async function runSqlQuery() {
    try {
      // Prevent dangerous operations in production
      const dangerous = /\b(DROP|TRUNCATE|DELETE|UPDATE|ALTER|CREATE|INSERT)\b/i;
      if (dangerous.test(sqlQuery)) {
        setMessage("⚠️ Dangerous operations not allowed. Use SELECT queries only.");
        return;
      }

      const data = await api<{ success: boolean; rows: Record<string, unknown>[] }>("/api/query", {
        method: "POST",
        body: JSON.stringify({ sql: sqlQuery })
      }, session.token);
      setSqlResult(data.rows || []);
      setMessage(`✓ Query executed successfully. ${data.rows?.length || 0} rows returned.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Query execution failed");
    }
  }

  const chartData = [
    { label: "Users", value: stats.users },
    { label: "Exams", value: stats.exams },
    { label: "Attempts", value: stats.attempts },
    { label: "Results", value: stats.results }
  ];

  // System Monitoring View (Dashboard)
  if (activeView === "dashboard") {
    return (
      <div className="grid gap-6">
        {/* Phase 4: Advanced Analytics Dashboard */}
        <AdminAnalytics
          stats={{
            totalUsers: stats.users,
            totalExams: stats.exams,
            totalAttempts: stats.attempts,
            avgScore: 75, // Mock data - calculate from real results
            cheatAttempts: 3 // Mock data - get from proctoring_logs
          }}
          trends={[
            { date: "Mon", attempts: 12 },
            { date: "Tue", attempts: 19 },
            { date: "Wed", attempts: 15 },
            { date: "Thu", attempts: 22 },
            { date: "Fri", attempts: 18 },
            { date: "Sat", attempts: 8 },
            { date: "Sun", attempts: 5 }
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest exam attempts and results</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <DataPreview title="" rows={attempts.slice(0, 8)} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Users & Results View
  if (activeView === "users") {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              User Management ({users.length})
            </CardTitle>
            <CardDescription>View and manage all system users</CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <DataPreview title="" rows={users} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Published Results ({results.length})
            </CardTitle>
            <CardDescription>All exam results in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No results yet</p>
              </div>
            ) : (
              <DataPreview title="" rows={results} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Database Console View
  if (activeView === "database") {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-500" />
              SQL Console
            </CardTitle>
            <CardDescription>Execute read-only SQL queries for data inspection</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">SQL Query</label>
              <textarea 
                className="min-h-32 w-full rounded-md border border-input bg-background/70 p-3 text-sm font-mono outline-none focus:ring-2 focus:ring-ring" 
                placeholder="Enter your SELECT query here..."
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="premium" onClick={runSqlQuery} size="lg">
                <Play className="h-4 w-4" />
                Execute Query
              </Button>
              <Button variant="outline" onClick={() => setSqlQuery("SELECT * FROM users LIMIT 20;")}>
                Users
              </Button>
              <Button variant="outline" onClick={() => setSqlQuery("SELECT * FROM examination LIMIT 20;")}>
                Exams
              </Button>
              <Button variant="outline" onClick={() => setSqlQuery("SELECT * FROM result LIMIT 20;")}>
                Results
              </Button>
              <Button variant="outline" onClick={() => setSqlQuery("SHOW TABLES;")}>
                Tables
              </Button>
            </div>

            {message && (
              <div className={cn(
                "rounded-md border p-3 text-sm",
                message.startsWith('✓') 
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                  : message.startsWith('⚠️')
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200"
                  : "border-border bg-muted"
              )}>
                {message}
              </div>
            )}
          </CardContent>
        </Card>

        {sqlResult.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Query Results ({sqlResult.length} rows)</CardTitle>
              <CardDescription>Data returned from your query</CardDescription>
            </CardHeader>
            <CardContent>
              <DataPreview title="" rows={sqlResult} />
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Gamification View
  if (activeView === "gamification") {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Student Gamification & Achievements
            </CardTitle>
            <CardDescription>Track student engagement, achievements, and progress</CardDescription>
          </CardHeader>
        </Card>

        {/* Phase 5: Gamification System */}
        <Gamification
          achievements={[
            {
              id: "first-exam",
              name: "First Steps",
              description: "Complete your first exam",
              icon: Trophy,
              unlocked: true
            },
            {
              id: "perfect-score",
              name: "Perfect Score",
              description: "Score 100% on any exam",
              icon: Trophy,
              unlocked: false,
              progress: 85
            },
            {
              id: "speed-demon",
              name: "Speed Demon",
              description: "Complete an exam in under 10 minutes",
              icon: Trophy,
              unlocked: true
            },
            {
              id: "streak-master",
              name: "Streak Master",
              description: "Maintain a 7-day login streak",
              icon: Trophy,
              unlocked: false,
              progress: 42
            },
            {
              id: "question-master",
              name: "Question Master",
              description: "Answer 100 questions correctly",
              icon: Trophy,
              unlocked: false,
              progress: 67
            }
          ]}
          points={1250}
          level={8}
          streak={5}
        />
      </div>
    );
  }

  // Default fallback
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Administrator</CardTitle>
          <CardDescription>Select a view from the sidebar navigation</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <ControlLine icon={LayoutDashboard} label="System monitoring and analytics" />
          <ControlLine icon={Users} label="User management and results" />
          <ControlLine icon={Trophy} label="Student gamification and achievements" />
          <ControlLine icon={Database} label="SQL console for data inspection" />
        </CardContent>
      </Card>
    </div>
  );
}

function FacultyWorkspace({ session, activeView }: { session: UserSession; activeView: string }) {
  const [questionForm, setQuestionForm] = useState({
    content: "",
    difficulty_level: "MEDIUM",
    subject_topic: "",
    tags: "",
    correct_answer: "A",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: ""
  });
  const [examForm, setExamForm] = useState({
    title: "",
    duration_minutes: "30",
    scheduled_time: "",
    question_id: "",
    exam_id: "",
    student_user_id: ""
  });
  const [questions, setQuestions] = useState<Record<string, unknown>[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attempts, setAttempts] = useState<Record<string, unknown>[]>([]);
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingField, setRecordingField] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [questionMode, setQuestionMode] = useState<'manual' | 'ai'>('manual');

  useEffect(() => {
    loadFacultyData();
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (recordingField) {
          setQuestionForm(prev => ({ ...prev, [recordingField]: prev[recordingField as keyof typeof prev] + (prev[recordingField as keyof typeof prev] ? " " : "") + transcript }));
        }
        setIsRecording(false);
        setRecordingField(null);
      };
      
      recognitionInstance.onerror = () => {
        setIsRecording(false);
        setRecordingField(null);
        setMessage("Voice recognition error. Please try again.");
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
        setRecordingField(null);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  async function loadFacultyData() {
    try {
      const [q, e, a] = await Promise.all([
        api<{ success: boolean; questions: Record<string, unknown>[] }>("/api/questions/all", {}, session.token),
        api<{ success: boolean; exams: Exam[] }>("/api/exams/all", {}, session.token),
        api<{ success: boolean; attempts: Record<string, unknown>[] }>("/api/attempts/all", {}, session.token)
      ]);
      setQuestions((q.questions || []).filter((item) => Number(item.faculty_user_id) === session.user.user_id));
      setExams((e.exams || []).filter((item) => Number(item.faculty_user_id) === session.user.user_id));
      setAttempts(a.attempts || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load faculty data");
    }
  }

  function startVoiceRecording(field: string) {
    if (!recognition) {
      setMessage("Voice recognition not supported in this browser.");
      return;
    }
    setIsRecording(true);
    setRecordingField(field);
    recognition.start();
  }

  function stopVoiceRecording() {
    if (recognition && isRecording) {
      recognition.stop();
    }
  }

  async function addQuestion() {
    try {
      const result = await api<{ success: boolean; message: string; data: { question_id: number } }>("/api/questions/add", {
        method: "POST",
        body: JSON.stringify({
          ...questionForm,
          question_type: "MCQ",
          faculty_user_id: session.user.user_id
        })
      }, session.token);
      setMessage(`✓ ${result.message}. Question ID: ${result.data.question_id}`);
      setQuestionForm({
        content: "",
        difficulty_level: "MEDIUM",
        subject_topic: "",
        tags: "",
        correct_answer: "A",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: ""
      });
      await loadFacultyData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add question");
    }
  }

  async function createExam() {
    try {
      const result = await api<{ success: boolean; message: string; data: { exam_id: number } }>("/api/exams/create", {
        method: "POST",
        body: JSON.stringify({
          title: examForm.title,
          duration_minutes: Number(examForm.duration_minutes),
          scheduled_time: examForm.scheduled_time,
          faculty_user_id: session.user.user_id
        })
      }, session.token);
      setExamForm((current) => ({ ...current, exam_id: String(result.data.exam_id) }));
      setMessage(`✓ ${result.message}. Exam ID: ${result.data.exam_id}`);
      await loadFacultyData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create exam");
    }
  }

  async function assignQuestion() {
    try {
      const result = await api<{ success: boolean; message: string }>("/api/exam-questions/assign", {
        method: "POST",
        body: JSON.stringify({ exam_id: examForm.question_id, question_id: examForm.question_id })
      }, session.token);
      setMessage(`✓ ${result.message}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not assign question");
    }
  }

  async function assignStudent() {
    try {
      const result = await api<{ success: boolean; message: string }>("/api/student-exams/assign", {
        method: "POST",
        body: JSON.stringify({ exam_id: examForm.exam_id, student_user_id: examForm.student_user_id })
      }, session.token);
      setMessage(`✓ ${result.message}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not assign student");
    }
  }

  // Question Bank View
  if (activeView === "questions") {
    return (
      <div className="grid gap-6">
        {/* Mode Toggle - Manual vs AI Co-Pilot */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-1">
              <button 
                className={cn(
                  "rounded-md py-2 text-sm font-medium transition-colors",
                  questionMode === 'manual' && "bg-background shadow-sm"
                )} 
                onClick={() => setQuestionMode('manual')}
              >
                <FileQuestion className="h-4 w-4 inline mr-2" />
                Manual Creation
              </button>
              <button 
                className={cn(
                  "rounded-md py-2 text-sm font-medium transition-colors",
                  questionMode === 'ai' && "bg-background shadow-sm"
                )} 
                onClick={() => setQuestionMode('ai')}
              >
                <Sparkles className="h-4 w-4 inline mr-2" />
                AI Co-Pilot
              </button>
            </div>
          </CardContent>
        </Card>

        {/* AI Co-Pilot Mode */}
        {questionMode === 'ai' && (
          <AICoPilot
            token={session.token}
            facultyUserId={session.user.user_id}
            onQuestionsSaved={loadFacultyData}
          />
        )}

        {/* Manual Mode */}
        {questionMode === 'manual' && (
          <>
            {/* Phase 3: Question Import */}
            <QuestionImport
              onImport={async (questions) => {
                for (const q of questions) {
                  await api("/api/questions/add", {
                    method: "POST",
                    body: JSON.stringify({
                      content: q.content,
                      question_type: "MCQ",
                      correct_answer: q.correct_answer,
                      options: {
                        A: q.option_a,
                        B: q.option_b,
                        C: q.option_c,
                        D: q.option_d
                      },
                      difficulty_level: q.difficulty_level,
                      subject_topic: q.subject_topic,
                      tags: q.tags,
                      created_by: session.user.user_id
                    })
                  }, session.token);
                }
                await loadFacultyData();
                setMessage(`✅ Imported ${questions.length} questions successfully!`);
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="h-5 w-5 text-indigo-500" />
                  Create Auto-Evaluated MCQ
                </CardTitle>
                <CardDescription>
                  Use voice input or rich text editor. Correct answer is stored for instant evaluation.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="relative">
                  <label className="text-sm font-medium mb-2 block">Question Content</label>
                  {/* Phase 3: Rich Text Editor */}
                  <RichTextEditor
                    value={questionForm.content}
                    onChange={(value) => setQuestionForm({ ...questionForm, content: value })}
                    placeholder="Enter your question here (supports math equations, images, and formatting)..."
                  />
                  <button
                    onClick={() => isRecording && recordingField === 'content' ? stopVoiceRecording() : startVoiceRecording('content')}
                    className={cn(
                      "absolute right-2 top-9 rounded-full p-2 transition-colors z-10",
                      isRecording && recordingField === 'content'
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"
                    )}
              >
                {isRecording && recordingField === 'content' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map((option, idx) => (
                <div key={option} className="relative">
                  <Input 
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    value={questionForm[option]} 
                    onChange={(e) => setQuestionForm({ ...questionForm, [option]: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    onClick={() => isRecording && recordingField === option ? stopVoiceRecording() : startVoiceRecording(option)}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors",
                      isRecording && recordingField === option
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"
                    )}
                  >
                    {isRecording && recordingField === option ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  </button>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Correct Answer</label>
                <select className="min-h-11 w-full rounded-md border border-input bg-background/70 px-3 text-sm" value={questionForm.correct_answer} onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}>
                  {["A", "B", "C", "D"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Difficulty</label>
                <select className="min-h-11 w-full rounded-md border border-input bg-background/70 px-3 text-sm" value={questionForm.difficulty_level} onChange={(e) => setQuestionForm({ ...questionForm, difficulty_level: e.target.value })}>
                  {["EASY", "MEDIUM", "HARD"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <Input placeholder="Subject/topic" value={questionForm.subject_topic} onChange={(e) => setQuestionForm({ ...questionForm, subject_topic: e.target.value })} />
              <Input placeholder="Tags" value={questionForm.tags} onChange={(e) => setQuestionForm({ ...questionForm, tags: e.target.value })} />
            </div>

            {message && (
              <div className={cn(
                "rounded-md border p-3 text-sm",
                message.startsWith('✓') 
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                  : "border-border bg-muted"
              )}>
                {message}
              </div>
            )}

            <Button variant="premium" onClick={addQuestion} size="lg">
              <Plus className="h-4 w-4" />
              Save Question to Bank
            </Button>
          </CardContent>
        </Card>
          </>
        )}

        {/* Common Section - Show questions regardless of mode */}
        <Card>
          <CardHeader>
            <CardTitle>My Question Bank ({questions.length})</CardTitle>
            <CardDescription>Questions you've created for examinations</CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
                <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No questions created yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {questionMode === 'manual' ? 'Create your first MCQ question above.' : 'Generate questions using AI Co-Pilot above.'}
                </p>
              </div>
            ) : (
              <DataPreview title="" rows={questions} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Exam Creation View
  if (activeView === "exams") {
    return (
      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-500" />
                Create Exam
              </CardTitle>
              <CardDescription>Set up a new examination with duration and schedule</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input placeholder="Exam title (e.g., DBMS Final Exam)" value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} />
              <Input type="number" placeholder="Duration (minutes)" value={examForm.duration_minutes} onChange={(e) => setExamForm({ ...examForm, duration_minutes: e.target.value })} />
              <div>
                <label className="text-xs font-medium mb-1 block">Scheduled Time</label>
                <Input type="datetime-local" value={examForm.scheduled_time} onChange={(e) => setExamForm({ ...examForm, scheduled_time: e.target.value })} />
              </div>
              <Button variant="premium" onClick={createExam} size="lg">
                <ClipboardList className="h-4 w-4" />
                Create Exam
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage Questions</CardTitle>
              <CardDescription>Assign questions to exams</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input placeholder="Exam ID" value={examForm.exam_id} onChange={(e) => setExamForm({ ...examForm, exam_id: e.target.value })} />
              <Input placeholder="Question ID" value={examForm.question_id} onChange={(e) => setExamForm({ ...examForm, question_id: e.target.value })} />
              <Button variant="outline" onClick={assignQuestion}>
                <Plus className="h-4 w-4" />
                Attach Question
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assign Students</CardTitle>
              <CardDescription>Assign students to exam</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input placeholder="Exam ID" value={examForm.exam_id} onChange={(e) => setExamForm({ ...examForm, exam_id: e.target.value })} />
              <Input placeholder="Student ID" value={examForm.student_user_id} onChange={(e) => setExamForm({ ...examForm, student_user_id: e.target.value })} />
              <Button variant="outline" onClick={assignStudent}>
                <User className="h-4 w-4" />
                Assign Student
              </Button>
            </CardContent>
          </Card>

          {message && (
            <div className={cn(
              "rounded-md border p-3 text-sm",
              message.startsWith('✓') 
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                : "border-border bg-muted"
            )}>
              {message}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Exams ({exams.length})</CardTitle>
            <CardDescription>Examinations you've created</CardDescription>
          </CardHeader>
          <CardContent>
            {exams.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No exams created yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your first exam using the form on the left.
                </p>
              </div>
            ) : (
              <DataPreview title="" rows={exams as unknown as Record<string, unknown>[]} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Student Monitoring View
  if (activeView === "monitoring") {
    return (
      <div className="grid gap-6">
        {/* Phase 3: Faculty Monitoring with Real-time Proctoring */}
        <FacultyMonitoring
          facultyId={session.user.user_id}
          onPauseExam={(studentId, examId) => {
            setMessage(`Exam paused for student ${studentId}`);
          }}
          onTerminateExam={(studentId, examId, reason) => {
            setMessage(`Exam terminated for student ${studentId}: ${reason}`);
          }}
          onSendMessage={(studentId, message) => {
            setMessage(`Message sent to student ${studentId}`);
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Student Exam Attempts
            </CardTitle>
            <CardDescription>Monitor student exam attempts and performance</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No student attempts yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Attempts will appear here once students start taking exams.
                </p>
              </div>
            ) : (
              <DataPreview title="" rows={attempts} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default Dashboard View
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Faculty ID" value={session.user.user_id} icon={User} />
        <Metric label="Questions Created" value={questions.length} icon={FileQuestion} />
        <Metric label="Exams Created" value={exams.length} icon={ClipboardList} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {session.user.username}!</CardTitle>
          <CardDescription>Manage your examination system through the sidebar navigation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <ControlLine icon={FileQuestion} label="Create MCQ questions with voice input support" />
          <ControlLine icon={ClipboardList} label="Build and schedule examinations" />
          <ControlLine icon={Activity} label="Monitor student attempts and performance" />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No questions yet</p>
            ) : (
              <DataPreview title="" rows={questions.slice(0, 5)} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Exams</CardTitle>
          </CardHeader>
          <CardContent>
            {exams.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No exams yet</p>
            ) : (
              <DataPreview title="" rows={exams.slice(0, 5) as unknown as Record<string, unknown>[]} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentWorkspace({ session, activeView }: { session: UserSession; activeView: string }) {
  const [studentId, setStudentId] = useState(String(session.user.user_id));
  const [verified, setVerified] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [paper, setPaper] = useState<{ exam?: { title: string; duration: number }; questions: Question[] }>({ questions: [] });
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [message, setMessage] = useState("Verify your student ID to access assigned exams.");
  
  // Phase 1-2 Feature States
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [proctoredExamStarted, setProctoredExamStarted] = useState(false);

  const selectedExam = useMemo(() => exams.find((exam) => String(exam.exam_id) === selectedExamId), [exams, selectedExamId]);
  
  // Get answered questions
  const answeredQuestions = useMemo(() => Object.keys(answers).map(Number), [answers]);

  useEffect(() => {
    if (activeView === "results") {
      loadResults();
    }
  }, [activeView]);

  async function verifyStudentId() {
    if (Number(studentId) !== session.user.user_id) {
      setVerified(false);
      setMessage("Student ID does not match your logged-in account.");
      return;
    }

    try {
      const data = await api<{ success: boolean; exams: Exam[] }>(`/api/student-exams/${studentId}`, {}, session.token);
      setVerified(true);
      setExams(data.exams || []);
      setMessage(data.exams?.length ? "✓ ID verified successfully. Select an exam to begin." : "✓ ID verified. No exams assigned yet - contact your instructor.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not verify student ID");
    }
  }

  async function startExam() {
    if (!selectedExamId) return;
    try {
      const started = await api<{ success: boolean; attempt_id: number; message: string }>("/api/attempts/start", {
        method: "POST",
        body: JSON.stringify({ student_user_id: studentId, exam_id: selectedExamId })
      }, session.token);
      const paperData = await api<{ success: boolean; exam: { title: string; duration: number }; questions: Question[] }>(`/api/exams/paper/${selectedExamId}`, {}, session.token);
      setAttemptId(started.attempt_id);
      setPaper({ exam: paperData.exam, questions: paperData.questions || [] });
      setAnswers({});
      setExamStartTime(new Date());
      setCurrentQuestionIndex(0);
      setBookmarkedQuestions([]);
      setProctoredExamStarted(false); // Will be set to true after proctoring setup
      setMessage(`${started.message}. Your answers are saved automatically.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start exam");
    }
  }

  async function markAnswer(questionId: number, answer: string) {
    if (!attemptId) return;
    setAnswers((current) => ({ ...current, [questionId]: answer }));
    try {
      await api("/api/student-answers/save", {
        method: "POST",
        body: JSON.stringify({ attempt_id: attemptId, question_id: questionId, selected_answer: answer })
      }, session.token);
      setMessage("✓ Answer saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save answer");
    }
  }

  async function submitExam() {
    if (!attemptId) return;
    try {
      const data = await api<{ success: boolean; score: number; total_questions: number; message: string }>("/api/attempts/submit", {
        method: "POST",
        body: JSON.stringify({ attempt_id: attemptId })
      }, session.token);
      setMessage(`✓ ${data.message}. Your score: ${data.score}/${data.total_questions}`);
      await loadResults();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit exam");
    }
  }

  async function loadResults() {
    try {
      const data = await api<{ success: boolean; results: Record<string, unknown>[] }>("/api/results/all", {}, session.token);
      const myResults = (data.results || []).filter((r) => Number(r.student_user_id) === session.user.user_id);
      setResults(myResults);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load results");
    }
  }

  // ID Verification View
  if (activeView === "verification") {
    return (
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              Student ID Verification
            </CardTitle>
            <CardDescription>
              Verify your student ID to access your assigned examinations. Your ID must match your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm font-medium text-muted-foreground">Your Account Student ID</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{session.user.user_id}</p>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Enter Student ID
              <Input 
                placeholder="Enter your student ID" 
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)}
                className="text-lg"
              />
            </label>
            <Button variant="premium" onClick={verifyStudentId} size="lg">
              <ShieldCheck className="h-4 w-4" />
              Verify Student ID
            </Button>
            {message && (
              <div className={cn(
                "rounded-md border p-3 text-sm",
                verified 
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                  : "border-border bg-muted"
              )}>
                {message}
              </div>
            )}
            {verified && exams.length > 0 && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="font-semibold text-emerald-700 dark:text-emerald-200">✓ Verification Successful</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">
                  You have {exams.length} exam(s) assigned. Go to "Assigned Exams" to view them.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Assigned Exams View
  if (activeView === "exams") {
    return (
      <div className="grid gap-6">
        {!verified && (
          <Card className="border-amber-500/30 bg-amber-500/10">
            <CardContent className="pt-6">
              <p className="text-amber-700 dark:text-amber-200">
                ⚠️ Please verify your student ID first in the "ID Verification" section.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-indigo-500" />
                Exam Selection
              </CardTitle>
              <CardDescription>Select an assigned exam to begin your assessment.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <select 
                className="min-h-11 rounded-md border border-input bg-background/70 px-3 text-sm" 
                disabled={!verified} 
                value={selectedExamId} 
                onChange={(e) => setSelectedExamId(e.target.value)}
              >
                <option value="">Select an exam</option>
                {exams.map((exam) => (
                  <option key={exam.exam_id} value={exam.exam_id}>
                    {exam.title} (ID: {exam.exam_id})
                  </option>
                ))}
              </select>

              {selectedExam && (
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4">
                  <p className="font-semibold text-indigo-700 dark:text-indigo-200">{selectedExam.title}</p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-300 mt-1">
                    Duration: {selectedExam.duration_minutes} minutes
                  </p>
                  {selectedExam.scheduled_time && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Scheduled: {new Date(selectedExam.scheduled_time).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <Button variant="premium" disabled={!selectedExamId || !verified} onClick={startExam} size="lg">
                <Play className="h-4 w-4" />
                Start Exam
              </Button>

              {message && (
                <div className="rounded-md border border-border bg-muted p-3 text-sm">{message}</div>
              )}
            </CardContent>
          </Card>

          {attemptId && paper.questions.length > 0 && !proctoredExamStarted && examStartTime && (
            <ProctoredExam
              examId={Number(selectedExamId)}
              studentId={session.user.user_id}
              attemptId={attemptId}
              onExamStart={() => setProctoredExamStarted(true)}
              onExamEnd={submitExam}
            >
              {/* This renders the proctoring setup screen */}
              <div />
            </ProctoredExam>
          )}

          {attemptId && paper.questions.length > 0 && proctoredExamStarted && (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              {/* Main Exam Area */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{paper.exam?.title || "Examination"}</CardTitle>
                    {examStartTime && paper.exam?.duration && (
                      <ExamTimer
                        durationMinutes={paper.exam.duration}
                        startTime={examStartTime}
                        onTimeUp={submitExam}
                        onWarning={(mins) => setMessage(`⏰ ${mins} minutes remaining!`)}
                      />
                    )}
                  </div>
                  <CardDescription>
                    Question {currentQuestionIndex + 1} of {paper.questions.length} • Auto-save enabled
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  {/* Current Question */}
                  {paper.questions[currentQuestionIndex] && (
                    <div className="rounded-lg border border-border p-6">
                      <p className="font-medium text-lg mb-4">
                        <span className="text-indigo-600 dark:text-indigo-400">Q{currentQuestionIndex + 1}.</span>{" "}
                        {paper.questions[currentQuestionIndex].content}
                      </p>
                      <div className="grid gap-3">
                        {(["A", "B", "C", "D"] as const).map((key) => {
                          const text = paper.questions[currentQuestionIndex].options?.[key];
                          if (!text) return null;
                          const isSelected = answers[paper.questions[currentQuestionIndex].question_id] === key;
                          return (
                            <button
                              key={key}
                              onClick={() => markAnswer(paper.questions[currentQuestionIndex].question_id, key)}
                              className={cn(
                                "text-left rounded-md border p-4 text-sm transition-colors",
                                isSelected
                                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200 font-medium"
                                  : "border-border bg-background hover:bg-muted"
                              )}
                            >
                              <span className="font-semibold">{key}.</span> {text}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button variant="premium" size="lg" onClick={submitExam}>
                    <Save className="h-4 w-4" />
                    Submit Exam for Grading
                  </Button>

                  {message && (
                    <div className="rounded-md border border-border bg-muted p-3 text-sm">{message}</div>
                  )}
                </CardContent>
              </Card>

              {/* Sidebar with Navigation */}
              <div className="space-y-4">
                <QuestionNavigation
                  questions={paper.questions}
                  currentQuestionIndex={currentQuestionIndex}
                  answeredQuestions={answeredQuestions}
                  bookmarkedQuestions={bookmarkedQuestions}
                  onNavigate={(index) => setCurrentQuestionIndex(index)}
                  onToggleBookmark={(questionId) => {
                    setBookmarkedQuestions(prev =>
                      prev.includes(questionId)
                        ? prev.filter(id => id !== questionId)
                        : [...prev, questionId]
                    );
                  }}
                />
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCalculator(!showCalculator)}
                >
                  <CalculatorIcon className="h-4 w-4" />
                  {showCalculator ? "Hide" : "Show"} Calculator
                </Button>
              </div>
            </div>
          )}

          {/* Calculator Widget */}
          {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}
        </div>
      </div>
    );
  }

  // Results View
  if (activeView === "results") {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Auto-Evaluated Results
            </CardTitle>
            <CardDescription>
              View your exam results with instant automated evaluation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No results available yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete an exam to see your results here.
                </p>
              </div>
            ) : (
              <DataPreview title="" rows={results} />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default Dashboard View
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Student ID" value={session.user.user_id} icon={User} />
        <Metric label="Assigned Exams" value={verified ? exams.length : "-"} icon={GraduationCap} />
        <Metric label="Completed" value={results.length} icon={CheckCircle2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {session.user.username}!</CardTitle>
          <CardDescription>Access your examinations through the sidebar navigation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <ControlLine icon={ShieldCheck} label="Verify your student ID to unlock exams" />
          <ControlLine icon={GraduationCap} label="View and attempt assigned examinations" />
          <ControlLine icon={CheckCircle2} label="Check your auto-evaluated results" />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Activity }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold">{value.toLocaleString()}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function ControlLine({ icon: Icon, label }: { icon: typeof Activity; label: string }) {
  return (
    <div className="flex min-h-11 items-center gap-3 rounded-md border border-border px-3 text-sm">
      <Icon className="h-4 w-4 text-indigo-500" />
      {label}
    </div>
  );
}

function DataPreview({ title, rows }: { title: string; rows: Record<string, unknown>[] }) {
  const columns = rows[0] ? Object.keys(rows[0]).slice(0, 6) : [];
  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{rows.length ? "Recent database records" : "No rows to show yet"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto rounded-md border border-border">
          {!rows.length ? (
            <div className="p-4 text-sm text-muted-foreground">No data available.</div>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted">
                <tr>{columns.map((column) => <th key={column} className="px-3 py-2 text-left font-medium">{column}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-t border-border">
                    {columns.map((column) => (
                      <td key={column} className="max-w-52 truncate px-3 py-2">
                        {String(row[column] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default App;
