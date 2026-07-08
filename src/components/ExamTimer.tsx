/**
 * Exam Timer Component
 * Features: Countdown timer, warnings, auto-submit, time extension support
 */

import { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

interface ExamTimerProps {
  durationMinutes: number;
  startTime: Date;
  onTimeUp: () => void;
  onWarning?: (minutesRemaining: number) => void;
  timeExtensionSeconds?: number;
  className?: string;
}

export default function ExamTimer({
  durationMinutes,
  startTime,
  onTimeUp,
  onWarning,
  timeExtensionSeconds = 0,
  className
}: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningLevel, setWarningLevel] = useState<'none' | 'low' | 'medium' | 'critical'>('none');
  const [showCountdown, setShowCountdown] = useState(false);
  
  const warningShownRef = useRef({ low: false, medium: false, critical: false });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const totalDuration = (durationMinutes * 60 * 1000) + (timeExtensionSeconds * 1000);
      const elapsed = now - start;
      const remaining = totalDuration - elapsed;

      return Math.max(0, Math.floor(remaining / 1000)); // in seconds
    };

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Check for warnings
      const minutesRemaining = remaining / 60;
      const totalMinutes = durationMinutes + (timeExtensionSeconds / 60);

      // Critical warning: 2 minutes or less
      if (remaining <= 120 && remaining > 0 && !warningShownRef.current.critical) {
        setWarningLevel('critical');
        setShowWarning(true);
        warningShownRef.current.critical = true;
        onWarning?.(2);
        playWarningSound();
      }
      // Medium warning: 10% time remaining
      else if (minutesRemaining <= totalMinutes * 0.1 && !warningShownRef.current.medium) {
        setWarningLevel('medium');
        setShowWarning(true);
        warningShownRef.current.medium = true;
        onWarning?.(Math.floor(minutesRemaining));
        playWarningSound();
      }
      // Low warning: 25% time remaining
      else if (minutesRemaining <= totalMinutes * 0.25 && !warningShownRef.current.low) {
        setWarningLevel('low');
        setShowWarning(true);
        warningShownRef.current.low = true;
        onWarning?.(Math.floor(minutesRemaining));
      }

      // Show 10-second countdown
      if (remaining <= 10 && remaining > 0) {
        setShowCountdown(true);
      }

      // Time's up
      if (remaining === 0) {
        onTimeUp();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [durationMinutes, startTime, timeExtensionSeconds, onTimeUp, onWarning]);

  // Play warning sound
  const playWarningSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZPQ0');
      }
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      // Ignore audio errors
    }
  };

  // Format time as HH:MM:SS or MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get color based on time remaining
  const getTimerColor = () => {
    const totalSeconds = durationMinutes * 60 + timeExtensionSeconds;
    const percentage = (timeRemaining / totalSeconds) * 100;

    if (percentage <= 3 || timeRemaining <= 120) {
      return 'text-red-600 dark:text-red-400';
    } else if (percentage <= 10) {
      return 'text-orange-600 dark:text-orange-400';
    } else if (percentage <= 25) {
      return 'text-amber-600 dark:text-amber-400';
    }
    return 'text-foreground';
  };

  // Get warning message
  const getWarningMessage = () => {
    if (warningLevel === 'critical') {
      return 'Only 2 minutes remaining! Please complete your exam.';
    } else if (warningLevel === 'medium') {
      return '10% of exam time remaining. Please review your answers.';
    } else if (warningLevel === 'low') {
      return '25% of exam time remaining. Plan your time accordingly.';
    }
    return '';
  };

  return (
    <>
      {/* Timer Display */}
      <div className={cn('flex items-center gap-2 rounded-lg border bg-card px-4 py-2', className)}>
        <Clock className={cn('h-5 w-5', getTimerColor())} />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Time Remaining</span>
          <span className={cn('text-lg font-bold tabular-nums', getTimerColor())}>
            {formatTime(timeRemaining)}
          </span>
        </div>
        {timeExtensionSeconds > 0 && (
          <div className="ml-2 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            +{Math.floor(timeExtensionSeconds / 60)} min
          </div>
        )}
      </div>

      {/* Warning Banner */}
      {showWarning && (
        <div
          className={cn(
            'fixed left-0 right-0 top-0 z-50 flex items-center gap-3 px-6 py-3 text-sm font-medium shadow-lg',
            warningLevel === 'critical' && 'bg-red-600 text-white',
            warningLevel === 'medium' && 'bg-orange-500 text-white',
            warningLevel === 'low' && 'bg-amber-500 text-white'
          )}
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1">{getWarningMessage()}</span>
          <button
            onClick={() => setShowWarning(false)}
            className="rounded-md px-3 py-1 hover:bg-white/20"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 10-Second Countdown */}
      {showCountdown && timeRemaining > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <Bell className="mx-auto h-16 w-16 animate-bounce text-red-500 mb-4" />
            <p className="text-white text-xl font-semibold mb-2">Auto-submitting in</p>
            <p className="text-red-500 text-8xl font-bold tabular-nums">{timeRemaining}</p>
            <p className="text-white text-sm mt-4">Your exam will be submitted automatically</p>
          </div>
        </div>
      )}
    </>
  );
}
