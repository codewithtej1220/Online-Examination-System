/**
 * Proctored Exam Component
 * Features: Video proctoring, Face detection, Lockdown mode, Tab switching prevention
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import RecordRTC, { StereoAudioRecorder } from 'recordrtc';
import { AlertCircle, Camera, CameraOff, Shield, AlertTriangle, CheckCircle2, Video, Mic, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface ProctoredExamProps {
  examId: number;
  studentId: number;
  attemptId: number;
  onExamStart: () => void;
  onExamEnd: () => void;
  children: React.ReactNode;
}

interface Alert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp?: Date;
}

interface Analysis {
  faceCount: number;
  headPose: string;
  suspiciousScore: number;
}

export default function ProctoredExam({
  examId,
  studentId,
  attemptId,
  onExamStart,
  onExamEnd,
  children
}: ProctoredExamProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [multipleMonitors, setMultipleMonitors] = useState(false);
  const [faceDetected, setFaceDetected] = useState<boolean | null>(null); // null = not checked, true = detected, false = not detected
  const [multipleFaces, setMultipleFaces] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recorderRef = useRef<RecordRTC | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to proctoring server');
    });

    newSocket.on('proctoring:session-started', (data) => {
      setSessionId(data.sessionId);
      console.log('✅ Proctoring session started:', data.sessionId);
    });

    newSocket.on('proctoring:alert', (data) => {
      console.warn('⚠️ Proctoring alert:', data);
      if (data.alerts) {
        setAlerts(prev => [...prev, ...data.alerts].slice(-10)); // Keep last 10 alerts
      }
    });

    newSocket.on('proctoring:analysis', (data) => {
      setAnalysis(data);
      
      // Update face detection status
      if (data.faceCount !== undefined) {
        setFaceDetected(data.faceCount > 0);
        setMultipleFaces(data.faceCount > 1);
      }
    });

    newSocket.on('proctoring:faculty-message', (data) => {
      alert(`Message from Faculty: ${data.message}`);
    });

    newSocket.on('exam:paused-by-faculty', () => {
      alert('Exam has been paused by faculty');
    });

    newSocket.on('exam:terminated-by-faculty', (data) => {
      alert(`Exam terminated by faculty: ${data.reason}`);
      onExamEnd();
    });

    setSocket(newSocket);

    // Auto-request camera on mount (for better UX)
    setTimeout(() => {
      enableCamera();
    }, 500);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Request camera access
  const enableCamera = async () => {
    try {
      console.log('🎥 Requesting camera and microphone access...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: true // Enable audio for noise detection
      });

      console.log('✅ Camera and microphone access granted');
      console.log('Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('✅ Video metadata loaded');
              resolve();
            };
          }
        });
        
        setCameraEnabled(true);
        setCameraError(null);
        
        // Setup audio monitoring for noise detection
        setupAudioMonitoring(stream);
      }
      
      // Check for multiple monitors
      checkMultipleMonitors();
    } catch (error: any) {
      console.error('❌ Camera access error:', error);
      
      let errorMessage = 'Camera access denied. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera or microphone found. Please connect a device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage += 'Camera does not meet the required specifications.';
      } else {
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      setCameraError(errorMessage);
    }
  };

  // Setup audio monitoring for background noise detection
  const setupAudioMonitoring = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const checkAudioLevel = () => {
        if (!analyserRef.current || !examStarted) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        
        // Alert if unusual noise level detected
        if (average > 150 && examStarted) {
          if (socket) {
            socket.emit('proctoring:high-noise', {
              level: average,
              timestamp: new Date()
            });
          }
        }
        
        requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
    } catch (error) {
      console.error('Audio monitoring setup failed:', error);
    }
  };

  // Check for multiple monitors
  const checkMultipleMonitors = async () => {
    try {
      // DISABLED FOR TESTING: Always set to false
      // For production, uncomment the detection logic below
      setMultipleMonitors(false);
      
      /* PRODUCTION CODE - Uncomment for real monitor detection:
      // @ts-ignore - Screen API may not be in TypeScript definitions
      if (window.screen && window.screen.isExtended) {
        // @ts-ignore
        const isExtended = await window.screen.isExtended();
        setMultipleMonitors(isExtended);
        
        if (isExtended && socket) {
          socket.emit('proctoring:multiple-monitors', {
            detected: true,
            timestamp: new Date()
          });
        }
      }
      */
    } catch (error) {
      console.error('Multiple monitor detection failed:', error);
      setMultipleMonitors(false); // Default to false on error
    }
  };

  // Disable camera
  const disableCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setCameraEnabled(false);
  };

  // Start video recording
  const startRecording = () => {
    if (!streamRef.current) return;

    try {
      const recorder = new RecordRTC(streamRef.current, {
        type: 'video',
        mimeType: 'video/webm',
        videoBitsPerSecond: 1000000, // 1 Mbps
        frameRate: 15,
        disableLogs: true
      });

      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
      
      console.log('✅ Video recording started');
    } catch (error) {
      console.error('Recording start failed:', error);
    }
  };

  // Stop video recording and upload
  const stopRecording = async () => {
    if (!recorderRef.current) return;

    try {
      recorderRef.current.stopRecording(async () => {
        const blob = recorderRef.current?.getBlob();
        if (!blob) return;

        // Create FormData for upload
        const formData = new FormData();
        formData.append('video', blob, `exam_${examId}_student_${studentId}_${attemptId}.webm`);
        formData.append('examId', examId.toString());
        formData.append('studentId', studentId.toString());
        formData.append('attemptId', attemptId.toString());
        formData.append('sessionId', sessionId || '');

        // Upload to backend
        try {
          const response = await fetch('http://localhost:5000/api/proctoring/upload-recording', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            console.log('✅ Video recording uploaded successfully');
          } else {
            console.error('❌ Video upload failed:', await response.text());
          }
        } catch (error) {
          console.error('❌ Video upload error:', error);
        }

        setIsRecording(false);
      });
    } catch (error) {
      console.error('Recording stop failed:', error);
    }
  };

  // Capture and send frame for analysis
  const captureAndAnalyzeFrame = () => {
    if (!videoRef.current || !canvasRef.current || !socket || !sessionId) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to base64
    const frameData = canvas.toDataURL('image/jpeg', 0.8);

    // Send frame to server for analysis
    socket.emit('proctoring:send-frame', {
      frame: frameData
    });
  };

  // Start exam with fullscreen and lockdown
  const startExam = async () => {
    // Ensure camera is enabled
    if (!cameraEnabled) {
      await enableCamera();
    }

    // Join exam session via socket
    if (socket) {
      socket.emit('student:join-exam', {
        examId,
        studentId,
        attemptId
      });
    }

    // Request fullscreen (optional for localhost)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (!isLocalhost) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('Fullscreen request failed:', error);
        const shouldContinue = confirm('Fullscreen mode is recommended. Continue without fullscreen? (Not recommended for production)');
        if (!shouldContinue) {
          return;
        }
      }
    } else {
      console.log('📝 Running on localhost - fullscreen skipped for testing');
      setIsFullscreen(false); // Mark as not in fullscreen for localhost
    }

    // Start video recording
    startRecording();

    // Start frame analysis (every 2 seconds)
    frameIntervalRef.current = setInterval(captureAndAnalyzeFrame, 2000);

    setExamStarted(true);
    onExamStart();
  };

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && examStarted) {
        // Student exited fullscreen during exam
        if (socket) {
          socket.emit('proctoring:exit-fullscreen');
        }
        alert('⚠️ You exited fullscreen mode. This has been reported to faculty.');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [examStarted, socket]);

  // Monitor tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && examStarted) {
        // Student switched tabs
        if (socket) {
          socket.emit('proctoring:tab-switch', {
            timestamp: new Date()
          });
        }
        alert('⚠️ Tab switching detected. This has been reported to faculty.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [examStarted, socket]);

  // Prevent copy/paste
  useEffect(() => {
    if (!examStarted) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      if (socket) {
        socket.emit('proctoring:copy-paste', { action: 'copy' });
      }
      alert('⚠️ Copy action blocked and reported.');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      if (socket) {
        socket.emit('proctoring:copy-paste', { action: 'paste' });
      }
      alert('⚠️ Paste action blocked and reported.');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      if (socket) {
        socket.emit('proctoring:copy-paste', { action: 'cut' });
      }
      alert('⚠️ Cut action blocked and reported.');
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  }, [examStarted, socket]);

  // Prevent right-click
  useEffect(() => {
    if (!examStarted) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [examStarted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      stopRecording();
      disableCamera();
    };
  }, []);

  // Pre-exam setup view
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl">
          <Card className="border-indigo-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Shield className="h-6 w-6 text-indigo-500" />
                Proctored Exam Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              {/* Camera Preview */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-slate-950">
                  {cameraEnabled ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 text-xs font-medium text-white">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                        Live
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <CameraOff className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="grid gap-3">
                  <h3 className="font-semibold">Requirements</h3>
                  <div className="grid gap-2 text-sm">
                    {/* Webcam Status */}
                    <div className={cn(
                      "flex items-center gap-3 rounded-md border-2 p-3 transition-all",
                      cameraEnabled 
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 shadow-sm shadow-emerald-500/20"
                        : cameraError
                        ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-200 shadow-sm shadow-red-500/20"
                        : "border-slate-600 bg-slate-800/50 text-slate-300"
                    )}>
                      {cameraEnabled ? (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      ) : cameraError ? (
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <Camera className="h-5 w-5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">Webcam enabled</div>
                        {cameraError && (
                          <div className="text-xs mt-0.5 opacity-90">Click button below to enable</div>
                        )}
                      </div>
                      {cameraEnabled && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>

                    {/* Microphone Status */}
                    <div className={cn(
                      "flex items-center gap-3 rounded-md border-2 p-3 transition-all",
                      cameraEnabled && audioLevel >= 0
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 shadow-sm shadow-emerald-500/20"
                        : cameraError
                        ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-200 shadow-sm shadow-red-500/20"
                        : "border-slate-600 bg-slate-800/50 text-slate-300"
                    )}>
                      {cameraEnabled && audioLevel >= 0 ? (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      ) : cameraError ? (
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <Mic className="h-5 w-5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">Microphone enabled</div>
                        {cameraEnabled && audioLevel > 0 && (
                          <div className="text-xs mt-0.5 opacity-90">Audio detected</div>
                        )}
                      </div>
                      {cameraEnabled && audioLevel >= 0 && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>

                    {/* Face Detection Status (only show when camera is enabled) */}
                    {cameraEnabled && faceDetected !== null && (
                      <div className={cn(
                        "flex items-center gap-3 rounded-md border-2 p-3 transition-all",
                        faceDetected && !multipleFaces
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 shadow-sm shadow-emerald-500/20"
                          : multipleFaces
                          ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-200 shadow-sm shadow-red-500/20"
                          : "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-200 shadow-sm shadow-amber-500/20"
                      )}>
                        {faceDetected && !multipleFaces ? (
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">
                            {faceDetected && !multipleFaces ? "Single face detected" : 
                             multipleFaces ? "Multiple faces detected!" :
                             "No face detected"}
                          </div>
                          <div className="text-xs mt-0.5 opacity-90">
                            {faceDetected && !multipleFaces ? "Ready for exam" : 
                             multipleFaces ? "Only you should be visible" :
                             "Position yourself in camera view"}
                          </div>
                        </div>
                        {faceDetected && !multipleFaces && (
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                    )}

                    {/* Multiple Monitors Warning */}
                    {multipleMonitors && (
                      <div className="flex items-center gap-3 rounded-md border-2 border-amber-500 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-200 shadow-sm shadow-amber-500/20">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-medium">Multiple monitors detected</div>
                          <div className="text-xs mt-0.5 opacity-90">Disable extra monitors or don't use them</div>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      </div>
                    )}

                    {/* Fullscreen Mode */}
                    <div className={cn(
                      "flex items-center gap-3 rounded-md border-2 p-3 transition-all",
                      "border-slate-600 bg-slate-800/50 text-slate-300"
                    )}>
                      <Shield className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">Fullscreen mode required</div>
                        <div className="text-xs mt-0.5 opacity-75">Not available on localhost (testing mode)</div>
                      </div>
                    </div>

                    {/* Tab Switching */}
                    <div className={cn(
                      "flex items-center gap-3 rounded-md border-2 p-3 transition-all",
                      "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-200"
                    )}>
                      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">No tab switching allowed</div>
                        <div className="text-xs mt-0.5 opacity-90">Will be detected and reported</div>
                      </div>
                    </div>

                    {/* Video Recording */}
                    <div className={cn(
                      "flex items-center gap-3 rounded-md border-2 p-3 transition-all",
                      cameraEnabled
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 shadow-sm shadow-emerald-500/20"
                        : "border-slate-600 bg-slate-800/50 text-slate-300"
                    )}>
                      {cameraEnabled ? (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                      ) : (
                        <Video className="h-5 w-5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">Video recording enabled</div>
                        {cameraEnabled && (
                          <div className="text-xs mt-0.5 opacity-90">Ready to record</div>
                        )}
                      </div>
                      {cameraEnabled && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                  </div>

                  {!cameraEnabled && (
                    <Button onClick={enableCamera} variant="premium" size="lg" className="w-full">
                      <Camera className="h-5 w-5" />
                      Enable Camera & Microphone
                    </Button>
                  )}

                  {cameraEnabled && (
                    <div className="space-y-2">
                      <div className="rounded-lg border-2 border-emerald-500 bg-emerald-500/10 p-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-200">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-semibold">Camera & Microphone Active</span>
                        </div>
                      </div>
                      <Button onClick={disableCamera} variant="outline" size="lg" className="w-full">
                        <CameraOff className="h-5 w-5" />
                        Disable Camera & Microphone
                      </Button>
                    </div>
                  )}

                  {cameraError && (
                    <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-200">
                      {cameraError}
                    </div>
                  )}
                  
                  {multipleMonitors && (
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
                      ⚠️ Multiple monitors detected. Please disable extra monitors or ensure you don't look at them during the exam.
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-200">
                  <AlertTriangle className="h-5 w-5" />
                  Proctoring Rules
                </h3>
                <ul className="grid gap-1 text-sm text-amber-700/90 dark:text-amber-200/90">
                  <li>• Your face must be visible throughout the exam</li>
                  <li>• Do not look away from the screen for extended periods</li>
                  <li>• No other person should be visible in the frame</li>
                  <li>• Tab switching will be detected and reported</li>
                  <li>• Copy/paste operations are blocked</li>
                  <li>• Right-click is disabled during the exam</li>
                  <li>• Faculty can monitor your exam in real-time</li>
                </ul>
              </div>

              {/* Start Button */}
              <div className="grid gap-3">
                <Button
                  onClick={startExam}
                  disabled={!cameraEnabled}
                  size="lg"
                  variant="premium"
                  className="w-full text-lg"
                >
                  <Video className="h-5 w-5" />
                  Start Proctored Exam
                </Button>

                {/* Testing Mode: Skip Proctoring */}
                <Button
                  onClick={() => {
                    // Skip camera setup and start exam directly
                    setExamStarted(true);
                    onExamStart();
                  }}
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <AlertTriangle className="h-5 w-5" />
                  Skip Proctoring (Testing Mode)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      </div>
    );
  }

  // Exam in progress view
  return (
    <div className="relative min-h-screen bg-background">
      {/* Proctoring Status Bar */}
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-sm font-medium">Recording</span>
            </div>
            
            {analysis && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Faces: {analysis.faceCount}</span>
                <span>•</span>
                <span className="capitalize">{analysis.headPose.replace('_', ' ')}</span>
                <span>•</span>
                <span className={cn(
                  "font-medium",
                  analysis.suspiciousScore > 50 ? "text-red-500" : 
                  analysis.suspiciousScore > 25 ? "text-amber-500" : 
                  "text-emerald-500"
                )}>
                  Risk: {analysis.suspiciousScore}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {alerts.length > 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
              </span>
            )}
            <Shield className="h-4 w-4 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Video Preview (Small corner view) */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative h-32 w-40 overflow-hidden rounded-lg border-2 border-border bg-slate-950 shadow-xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-md bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            REC
          </div>
        </div>
      </div>

      {/* Exam Content */}
      <div className="pt-14">
        {children}
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Alerts Notification */}
      {alerts.length > 0 && (
        <div className="fixed bottom-40 right-4 z-50 max-w-sm space-y-2">
          {alerts.slice(-3).map((alert, idx) => (
            <div
              key={idx}
              className={cn(
                "rounded-lg border p-3 text-sm shadow-lg backdrop-blur-xl",
                alert.severity === 'critical' && "border-red-500/30 bg-red-500/20 text-red-700 dark:text-red-200",
                alert.severity === 'high' && "border-orange-500/30 bg-orange-500/20 text-orange-700 dark:text-orange-200",
                alert.severity === 'medium' && "border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-200",
                alert.severity === 'low' && "border-blue-500/30 bg-blue-500/20 text-blue-700 dark:text-blue-200"
              )}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
