/**
 * Feature Demo Page - Showcases all Phase 1-6 features
 */

import { useState } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import ExamTimer from './components/ExamTimer';
import QuestionNavigation from './components/QuestionNavigation';
import Calculator from './components/Calculator';
import QuestionImport from './components/QuestionImport';
import AdminAnalytics from './components/AdminAnalytics';
import Gamification from './components/Gamification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

// Mock data
const mockQuestions = Array.from({ length: 20 }, (_, i) => ({
  question_id: i + 1,
  content: `Question ${i + 1}: Sample question text`,
  question_type: 'MCQ'
}));

const mockStats = {
  totalUsers: 1250,
  totalExams: 89,
  totalAttempts: 3420,
  avgScore: 78.5,
  cheatAttempts: 12
};

const mockTrends = [
  { date: 'Mon', attempts: 120 },
  { date: 'Tue', attempts: 150 },
  { date: 'Wed', attempts: 180 },
  { date: 'Thu', attempts: 160 },
  { date: 'Fri', attempts: 200 }
];

const mockAchievements = [
  { id: '1', name: 'First Exam', description: 'Complete your first exam', icon: require('lucide-react').Trophy, unlocked: true },
  { id: '2', name: 'Perfect Score', description: 'Get 100% on an exam', icon: require('lucide-react').Star, unlocked: false, progress: 85 },
  { id: '3', name: '10 Day Streak', description: 'Practice for 10 days in a row', icon: require('lucide-react').Award, unlocked: false, progress: 60 }
];

export default function FeatureDemo() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answered, setAnswered] = useState<number[]>([1, 2, 5]);
  const [bookmarked, setBookmarked] = useState<number[]>([3, 7]);
  const [showCalculator, setShowCalculator] = useState(false);

  const handleImport = async (questions: any[]) => {
    console.log('Importing questions:', questions);
    alert(`Would import ${questions.length} questions to database`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="border-indigo-500/30">
          <CardHeader>
            <CardTitle className="text-3xl">🎉 OES Feature Showcase</CardTitle>
            <p className="text-muted-foreground">
              All 27 features from Phases 1-6 implemented and ready to use
            </p>
          </CardHeader>
        </Card>

        <Tabs defaultValue="phase2" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="phase1">Phase 1</TabsTrigger>
            <TabsTrigger value="phase2">Phase 2</TabsTrigger>
            <TabsTrigger value="phase3">Phase 3</TabsTrigger>
            <TabsTrigger value="phase4">Phase 4</TabsTrigger>
            <TabsTrigger value="phase5">Phase 5</TabsTrigger>
            <TabsTrigger value="phase6">Phase 6</TabsTrigger>
          </TabsList>

          <TabsContent value="phase1" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Phase 1: Exam Security Suite</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">✅ Video Proctoring</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Real-time webcam capture with WebRTC</li>
                    <li>• AI face detection using Python + MediaPipe</li>
                    <li>• Head pose tracking (looking away detection)</li>
                    <li>• Multiple face detection</li>
                    <li>• Video recording with RecordRTC</li>
                    <li>• Files: ProctoredExam.tsx, proctoring_service.py</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">✅ Lockdown Mode</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Fullscreen enforcement</li>
                    <li>• Tab switching detection & blocking</li>
                    <li>• Copy/paste prevention</li>
                    <li>• Right-click disabled</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">✅ Faculty Monitoring</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Real-time student grid view</li>
                    <li>• Live alert feed with severity filtering</li>
                    <li>• Intervention controls (message, pause, terminate)</li>
                    <li>• File: FacultyMonitoring.tsx</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phase2" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>⏱️ Exam Timer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ExamTimer
                      durationMinutes={60}
                      startTime={new Date()}
                      onTimeUp={() => alert('Time is up!')}
                      onWarning={(min) => console.log(`Warning: ${min} min remaining`)}
                    />
                    <p className="mt-4 text-sm text-muted-foreground">
                      • Color-coded timer (green → amber → red)<br/>
                      • Three warning levels (25%, 10%, 2 min)<br/>
                      • 10-second countdown before auto-submit<br/>
                      • Time extension support
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>📚 Question Navigation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuestionNavigation
                      questions={mockQuestions}
                      currentQuestionIndex={currentQuestion}
                      answeredQuestions={answered}
                      bookmarkedQuestions={bookmarked}
                      onNavigate={setCurrentQuestion}
                      onToggleBookmark={(id) => {
                        setBookmarked(prev => 
                          prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
                        );
                      }}
                    />
                    <p className="mt-4 text-sm text-muted-foreground">
                      • Progress bar with statistics<br/>
                      • Question bookmarking<br/>
                      • Question palette (grid view)<br/>
                      • Quick navigation buttons
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>🧮 Calculator Widget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setShowCalculator(!showCalculator)} variant="premium">
                      {showCalculator ? 'Hide' : 'Show'} Calculator
                    </Button>
                    {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}
                    <p className="mt-4 text-sm text-muted-foreground">
                      • Draggable calculator<br/>
                      • Basic & Scientific modes<br/>
                      • Memory functions (M+, M-, MR, MC)<br/>
                      • Calculation history<br/>
                      • File: Calculator.tsx
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>💾 Auto-Save</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">✅ Implemented</h3>
                      <ul className="space-y-1 text-sm">
                        <li>• Auto-save every 30 seconds</li>
                        <li>• Immediate save on answer selection</li>
                        <li>• Offline support with queue</li>
                        <li>• Recovery on disconnect</li>
                        <li>• localStorage + IndexedDB backup</li>
                        <li>• File: useAutoSave.ts hook</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="phase3" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <QuestionImport onImport={handleImport} />
              
              <Card>
                <CardHeader>
                  <CardTitle>Phase 3: Faculty Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">✅ Implemented</h3>
                    <ul className="space-y-1 text-sm">
                      <li>• Excel/CSV import (QuestionImport.tsx)</li>
                      <li>• Rich text editor with equations (RichTextEditor.tsx)</li>
                      <li>• Question templates system</li>
                      <li>• Collaboration features</li>
                      <li>• Quality ratings</li>
                      <li>• Database tables: question_templates, question_collaborators, question_ratings</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="phase4" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Phase 4: Admin Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminAnalytics stats={mockStats} trends={mockTrends} />
                <p className="mt-4 text-sm text-muted-foreground">
                  • Real-time charts (Line, Bar, Doughnut)<br/>
                  • User statistics dashboard<br/>
                  • Trend analysis<br/>
                  • File: AdminAnalytics.tsx
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phase5" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Phase 5: Gamification</CardTitle>
              </CardHeader>
              <CardContent>
                <Gamification
                  achievements={mockAchievements}
                  points={2450}
                  level={8}
                  streak={12}
                />
                <p className="mt-4 text-sm text-muted-foreground">
                  • Points system<br/>
                  • Levels & progression<br/>
                  • Achievement badges<br/>
                  • Streak tracking<br/>
                  • File: Gamification.tsx
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phase6" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Phase 6: Performance & PWA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">✅ Implemented</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Service Worker for offline support</li>
                    <li>• PWA manifest.json</li>
                    <li>• Progressive Web App capabilities</li>
                    <li>• Offline caching</li>
                    <li>• Files: service-worker.js, manifest.json</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
