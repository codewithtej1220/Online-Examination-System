/**
 * Auto-Save Hook
 * Features: Auto-save every 30 seconds, immediate save on change, offline queue, recovery
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface AutoSaveOptions {
  attemptId: number;
  onSave: (data: any) => Promise<void>;
  interval?: number; // milliseconds
  enabled?: boolean;
}

interface SaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  error: string | null;
}

export function useAutoSave<T>({
  attemptId,
  onSave,
  interval = 30000, // 30 seconds default
  enabled = true
}: AutoSaveOptions) {
  const [data, setData] = useState<T | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    status: 'idle',
    lastSaved: null,
    error: null
  });
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const saveQueue = useRef<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedData = useRef<string | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Process queued saves when coming back online
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage as backup
  const saveToLocalStorage = useCallback((dataToSave: any) => {
    try {
      localStorage.setItem(`exam_draft_${attemptId}`, JSON.stringify({
        data: dataToSave,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('LocalStorage save failed:', error);
    }
  }, [attemptId]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(`exam_draft_${attemptId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data;
      }
    } catch (error) {
      console.error('LocalStorage load failed:', error);
    }
    return null;
  }, [attemptId]);

  // Process queued saves
  const processQueue = useCallback(async () => {
    if (saveQueue.current.length === 0 || !isOnline) return;

    while (saveQueue.current.length > 0) {
      const queuedData = saveQueue.current.shift();
      try {
        await onSave(queuedData);
      } catch (error) {
        // Re-queue if failed
        saveQueue.current.unshift(queuedData);
        break;
      }
    }
  }, [isOnline, onSave]);

  // Perform save
  const performSave = useCallback(async (dataToSave: any, immediate = false) => {
    if (!enabled || !dataToSave) return;

    // Check if data actually changed
    const dataString = JSON.stringify(dataToSave);
    if (dataString === lastSavedData.current) {
      return; // No changes, skip save
    }

    setSaveStatus({ status: 'saving', lastSaved: saveStatus.lastSaved, error: null });

    // Always save to localStorage
    saveToLocalStorage(dataToSave);

    if (!isOnline) {
      // Queue for later if offline
      saveQueue.current.push(dataToSave);
      setSaveStatus({
        status: 'saved',
        lastSaved: new Date(),
        error: 'Offline - queued for sync'
      });
      return;
    }

    try {
      await onSave(dataToSave);
      lastSavedData.current = dataString;
      setSaveStatus({
        status: 'saved',
        lastSaved: new Date(),
        error: null
      });
    } catch (error) {
      setSaveStatus({
        status: 'error',
        lastSaved: saveStatus.lastSaved,
        error: error instanceof Error ? error.message : 'Save failed'
      });
      
      // Queue for retry if save failed
      saveQueue.current.push(dataToSave);
      
      // Retry after 5 seconds
      setTimeout(() => processQueue(), 5000);
    }
  }, [enabled, isOnline, onSave, saveStatus.lastSaved, saveToLocalStorage, processQueue]);

  // Update data and trigger save
  const updateData = useCallback((newData: T, immediate = false) => {
    setData(newData);
    
    if (immediate) {
      performSave(newData, true);
    }
  }, [performSave]);

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled || !data) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      performSave(data, false);
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, data, interval, performSave]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (data) {
        // Synchronous save to localStorage
        saveToLocalStorage(data);
        
        // Attempt async save (may or may not complete)
        performSave(data, true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [data, saveToLocalStorage, performSave]);

  // Clear localStorage on successful final submit
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`exam_draft_${attemptId}`);
      lastSavedData.current = null;
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, [attemptId]);

  return {
    data,
    updateData,
    saveStatus,
    isOnline,
    queuedSaves: saveQueue.current.length,
    loadFromLocalStorage,
    clearDraft,
    manualSave: () => performSave(data, true)
  };
}
