import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Title, Tooltip, Legend } from 'chart.js';
import { CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TiltCard } from './ui/tilt-card';
import { AnimatedNumber } from './ui/animated-number';
import { TrendingUp, Users, FileText, AlertTriangle, Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Title, Tooltip, Legend);

export interface AdminOverview {
  roles: { student: number; faculty: number; admin: number };
  totals: { users: number; exams: number; questions: number; attempts: number; ongoing: number; results: number };
  avgScore: number | null;
  violations: number;
  trend: { date: string; attempts: number }[];
  distribution: { label: string; count: number }[];
  topExams: { exam_id: number; title: string; attempts: number }[];
}

const tickColor = 'rgb(148, 163, 184)';
const gridColor = 'rgba(148, 163, 184, 0.15)';
const axisOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: tickColor }, grid: { display: false } },
    y: { beginAtZero: true, ticks: { color: tickColor, precision: 0 }, grid: { color: gridColor } }
  }
};

export default function AdminAnalytics({ overview }: { overview: AdminOverview }) {
  const kpis = [
    { label: 'Total Users', value: overview.totals.users, icon: Users, glow: '99 102 241', hint: `${overview.roles.student} students · ${overview.roles.faculty} faculty` },
    { label: 'Total Exams', value: overview.totals.exams, icon: FileText, glow: '139 92 246', hint: `${overview.totals.questions} questions in bank` },
    { label: 'Avg Score', value: overview.avgScore ?? 0, icon: TrendingUp, glow: '16 185 129', suffix: '%', decimals: 1, hint: `${overview.totals.results} graded attempts` },
    { label: 'Violations', value: overview.violations, icon: AlertTriangle, glow: '239 68 68', hint: `${overview.totals.ongoing} exams in progress`, danger: true }
  ];

  const lineData = {
    labels: overview.trend.map((t) => t.date),
    datasets: [{
      label: 'Exam Attempts',
      data: overview.trend.map((t) => t.attempts),
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      pointBackgroundColor: 'rgb(99, 102, 241)',
      fill: true,
      tension: 0.4
    }]
  };

  const distributionData = {
    labels: overview.distribution.map((d) => d.label),
    datasets: [{
      label: 'Results',
      data: overview.distribution.map((d) => d.count),
      backgroundColor: ['#ef4444', '#f59e0b', '#eab308', '#6366f1', '#10b981'],
      borderRadius: 6
    }]
  };

  const doughnutData = {
    labels: ['Students', 'Faculty', 'Admins'],
    datasets: [{
      data: [overview.roles.student, overview.roles.faculty, overview.roles.admin],
      backgroundColor: ['#10b981', '#6366f1', '#f59e0b'],
      borderWidth: 0
    }]
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, glow, hint, suffix, decimals, danger }) => (
          <TiltCard key={label} glow={glow}>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `rgb(${glow} / 0.12)`, color: `rgb(${glow})` }}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className={`mt-3 text-3xl font-bold tracking-tight ${danger && value > 0 ? 'text-red-500' : ''}`}>
                {label === 'Avg Score' && overview.avgScore === null ? '—' : <AnimatedNumber value={value} suffix={suffix} decimals={decimals} />}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </div>
          </TiltCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <TiltCard className="lg:col-span-2" maxTilt={3}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-indigo-500" /> Exam Attempts — last 7 days</CardTitle>
            <CardDescription>Attempts started per day</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <Line data={lineData} options={axisOptions} />
          </CardContent>
        </TiltCard>

        <TiltCard maxTilt={4}>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Accounts by role</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <Doughnut
              data={doughnutData}
              options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: tickColor, usePointStyle: true } } } }}
            />
          </CardContent>
        </TiltCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TiltCard maxTilt={3}>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>How students are performing across all exams</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            <Bar data={distributionData} options={axisOptions} />
          </CardContent>
        </TiltCard>

        <TiltCard maxTilt={3}>
          <CardHeader>
            <CardTitle>Most Attempted Exams</CardTitle>
            <CardDescription>Top exams by number of attempts</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {overview.topExams.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No exams yet</p>}
            {overview.topExams.map((exam) => {
              const max = Math.max(1, ...overview.topExams.map((e) => e.attempts));
              return (
                <div key={exam.exam_id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate font-medium">{exam.title}</span>
                    <span className="text-muted-foreground">{exam.attempts}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-700" style={{ width: `${(exam.attempts / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </TiltCard>
      </div>
    </div>
  );
}
