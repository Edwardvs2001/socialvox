
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSurveyStore } from '@/store/surveyStore';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { responses, syncResponses } = useSurveyStore();
  const { isAuthenticated, checkSession } = useAuthStore();
  const syncInProgressRef = useRef(false);
  const setupListenersRef = useRef(false);
  const isMountedRef = useRef(true);
  
  // Number of pending responses that need sync
  const pendingCount = responses.filter(r => !r.syncedToServer).length;
  
  // Check online status - ensure we only set up listeners once
  useEffect(() => {
    if (setupListenersRef.current) return;
    
    const handleOnline = () => {
      if (isMountedRef.current) {
        setIsOnline(true);
        toast.success('Conexión reestablecida');
      }
    };
    
    const handleOffline = () => {
      if (isMountedRef.current) {
        setIsOnline(false);
        toast.warning('Conexión perdida. Los datos se guardarán localmente.');
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setupListenersRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      setupListenersRef.current = false;
    };
  }, []);
  
  // Auto-sync when coming back online - using useCallback to memoize the function
  const attemptSync = useCallback(async () => {
    if (!isOnline || pendingCount === 0 || !isAuthenticated || !checkSession() || syncInProgressRef.current) {
      return;
    }
    
    await sync();
  }, [isOnline, pendingCount, isAuthenticated, checkSession]);
  
  // Set up sync attempt when conditions change
  useEffect(() => {
    let syncTimeoutId: number;
    
    if (isOnline && pendingCount > 0 && isAuthenticated && !syncInProgressRef.current) {
      syncTimeoutId = window.setTimeout(() => {
        attemptSync();
      }, 100);
    }
    
    return () => {
      if (syncTimeoutId) {
        clearTimeout(syncTimeoutId);
      }
    };
  }, [attemptSync, isOnline, pendingCount, isAuthenticated]);
  
  // Manual sync function
  const sync = useCallback(async () => {
    if (!isOnline) {
      toast.error('No hay conexión a internet. Intente más tarde.');
      return;
    }
    
    if (pendingCount === 0) {
      toast.info('No hay datos pendientes de sincronización.');
      return;
    }
    
    if (!isAuthenticated || !checkSession()) {
      toast.error('Su sesión ha expirado. Por favor inicie sesión nuevamente.');
      return;
    }
    
    // Prevent multiple syncs from running simultaneously
    if (syncInProgressRef.current) {
      return;
    }
    
    syncInProgressRef.current = true;
    
    if (isMountedRef.current) {
      setIsSyncing(true);
    }
    
    try {
      await syncResponses();
      if (isMountedRef.current) {
        setLastSyncTime(new Date());
        toast.success(`Sincronización completa: ${pendingCount} ${pendingCount === 1 ? 'encuesta' : 'encuestas'} sincronizada${pendingCount === 1 ? '' : 's'}`);
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      if (isMountedRef.current) {
        toast.error('Error al sincronizar datos. Intente nuevamente.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
      
      // Use setTimeout to ensure state updates are completed before changing the ref
      setTimeout(() => {
        syncInProgressRef.current = false;
      }, 300);
    }
  }, [isOnline, pendingCount, isAuthenticated, checkSession, syncResponses]);
  
  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    sync,
  };
}
