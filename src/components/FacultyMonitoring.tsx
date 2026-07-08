/**
 * Faculty Live Monitoring Dashboard
 * Real-time proctoring supervision, student grid view, alerts, interventions
 */

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  AlertTriangle,
  Eye,
  MessageSquare,
  Pause,
  XCircle,
  Users,
  Activity,
  Clock,
  Video,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';

interface Student {
  studentId: number;
  sessionId: string;
  startTime: Date;
  alertCount: number;
  username?: string;
}

interface Violation {
  studentId: number;
  sessionId: string;
  alerts: Alert[];
  suspiciousScore: number;
  timestamp: Date;
}

interface Alert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

interface FacultyMonitoringProps {
  examId: number;
  facultyId: number;
}

export default function FacultyMonitoring({ examId, facultyId }: FacultyMonitoringProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Faculty connected to monitoring server');
      
      // Join monitoring room for this exam
      newSocket.emit('faculty:monitor-exam', {
        examId,
        facultyId
      });
    });

    newSocket.on('monitoring:students-list', (data: Student[]) => {
      setStudents(data);
    });

    newSocket.on('student:joined', (data) => {
      setStudents(prev => [...prev, {
        studentId: data.studentId,
        sessionId: data.sessionId,
        startTime: new Date(data.timestamp),
        alertCount: 0
      }]);
    });

    newSocket.on('monitoring:violation', (data: Violation) => {
      // Add violation to list
      setViolations(prev => [data, ...prev].slice(0, 100)); // Keep last 100
      
      // Update student alert count
      setStudents(prev => prev.map(student => 
        student.studentId === data.studentId
          ? { ...student, alertCount: student.alertCount + data.alerts.length }
          : student
      ));
    });

    newSocket.on('student:disconnected', (data) => {
      setStudents(prev => prev.filter(s => s.studentId !== data.studentId));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [examId, facultyId]);

  // Send message to student
  const sendMessage = () => {
    if (!socket || !selectedStudent || !message.trim()) return;

    socket.emit('faculty:send-message', {
      sessionId: selectedStudent,
      message: message.trim()
    });

    setMessage('');
    alert('Message sent to student');
  };

  // Pause exam for student
  const pauseExam = (sessionId: string) => {
    if (!socket) return;

    if (confirm('Are you sure you want to pause this student\'s exam?')) {
      socket.emit('faculty:pause-exam', { sessionId });
    }
  };

  // Terminate exam for student
  const terminateExam = (sessionId: string) => {
    if (!socket) return;

    const reason = prompt('Enter reason for termination:');
    if (reason) {
      socket.emit('faculty:terminate-exam', {
        sessionId,
        reason
      });
    }
  };

  // Filter violations by severity
  const filteredViolations = filterSeverity === 'all'
    ? violations
    : violations.filter(v => 
        v.alerts.some(a => a.severity === filterSeverity)
      );

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  // Calculate time elapsed
  const getTimeElapsed = (startTime: Date) => {
    const elapsed = Date.now() - new Date(startTime).getTime();
    const minutes = Math.floor(elapsed / 60000);
    return `${minutes} min`;
  };

  return (
    <div className="grid gap-6">
      {/* Header Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="text-3xl font-bold">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="text-3xl font-bold">{violations.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-3xl font-bold text-red-600">
                  {violations.filter(v => v.alerts.some(a => a.severity === 'critical')).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monitoring</p>
                <p className="text-xl font-bold text-emerald-600">Active</p>
              </div>
              <Activity className="h-8 w-8 text-emerald-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Students Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-indigo-500" />
              Live Student Monitoring
            </CardTitle>
            <CardDescription>
              Real-time proctoring view • Click student for actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/50 p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No students currently taking this exam</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {students.map(student => {
                  const studentViolations = violations.filter(v => v.studentId === student.studentId);
                  const highestSeverity = studentViolations.length > 0
                    ? Math.max(...studentViolations.flatMap(v => 
                        v.alerts.map(a => {
                          if (a.severity === 'critical') return 4;
                          if (a.severity === 'high') return 3;
                          if (a.severity === 'medium') return 2;
                          return 1;
                        })
                      ))
                    : 0;

                  return (
                    <Card
                      key={student.sessionId}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-lg",
                        selectedStudent === student.sessionId && "ring-2 ring-indigo-500",
                        highestSeverity >= 4 && "border-red-500/50",
                        highestSeverity === 3 && "border-orange-500/50"
                      )}
                      onClick={() => setSelectedStudent(student.sessionId)}
                    >
                      <CardContent className="pt-6">
                        <div className="grid gap-3">
                          {/* Student Info */}
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold">Student #{student.studentId}</p>
                              <p className="text-xs text-muted-foreground">
                                {student.username || `Session ${student.sessionId.slice(-6)}`}
                              </p>
                            </div>
                            {highestSeverity >= 3 && (
                              <AlertTriangle className={cn(
                                "h-5 w-5",
                                highestSeverity >= 4 ? "text-red-500 animate-pulse" : "text-orange-500"
                              )} />
                            )}
                          </div>

                          {/* Video Placeholder */}
                          <div className="aspect-video rounded-lg border border-border bg-slate-950 flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground" />
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {getTimeElapsed(student.startTime)}
                            </div>
                            <div className={cn(
                              "flex items-center gap-1 font-medium",
                              student.alertCount > 5 ? "text-red-600" :
                              student.alertCount > 0 ? "text-amber-600" :
                              "text-emerald-600"
                            )}>
                              <AlertCircle className="h-3 w-3" />
                              {student.alertCount} alerts
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(student.sessionId);
                              }}
                              className="flex-1"
                            >
                              <MessageSquare className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                pauseExam(student.sessionId);
                              }}
                            >
                              <Pause className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                terminateExam(student.sessionId);
                              }}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts Panel */}
        <div className="grid gap-6">
          {/* Message Student */}
          {selectedStudent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Send Message to Student</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendMessage();
                  }}
                />
                <Button onClick={sendMessage} variant="premium" disabled={!message.trim()}>
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Alerts Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Alert Feed
              </CardTitle>
              <div className="flex gap-2 mt-3">
                {['all', 'critical', 'high', 'medium', 'low'].map(severity => (
                  <Button
                    key={severity}
                    size="sm"
                    variant={filterSeverity === severity ? "default" : "outline"}
                    onClick={() => setFilterSeverity(severity)}
                    className="capitalize"
                  >
                    {severity}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 max-h-[600px] overflow-y-auto">
                {filteredViolations.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                    <p className="text-sm text-muted-foreground">No violations detected</p>
                  </div>
                ) : (
                  filteredViolations.map((violation, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-border bg-card p-3 text-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Student #{violation.studentId}</span>
                          <span className={cn(
                            "rounded-md px-2 py-0.5 text-xs font-medium",
                            violation.suspiciousScore > 50 ? "bg-red-500/20 text-red-700 dark:text-red-200" :
                            violation.suspiciousScore > 25 ? "bg-amber-500/20 text-amber-700 dark:text-amber-200" :
                            "bg-blue-500/20 text-blue-700 dark:text-blue-200"
                          )}>
                            Risk: {violation.suspiciousScore}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(violation.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="grid gap-1">
                        {violation.alerts.map((alert, alertIdx) => (
                          <div
                            key={alertIdx}
                            className={cn(
                              "rounded-md border p-2 text-xs",
                              getSeverityColor(alert.severity)
                            )}
                          >
                            <div className="flex items-center gap-1 font-medium capitalize">
                              {alert.severity === 'critical' && <XCircle className="h-3 w-3" />}
                              {alert.severity === 'high' && <AlertTriangle className="h-3 w-3" />}
                              {alert.severity === 'medium' && <AlertCircle className="h-3 w-3" />}
                              {alert.type.replace('_', ' ')}
                            </div>
                            <p className="mt-1">{alert.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
