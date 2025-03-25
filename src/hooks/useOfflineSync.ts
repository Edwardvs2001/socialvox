
import { useEffect, useState } from 'react';
import { useSurveyStore } from '@/store/surveyStore';
import { toast } from 'sonner';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { responses, syncResponses } = useSurveyStore();
  
  // Number of pending responses that need sync
  const pendingCount = responses.filter(r => !r.syncedToServer).length;
  
  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexión reestablecida');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Conexión perdida. Los datos se guardarán localmente.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      sync();
    }
  }, [isOnline, pendingCount]);
  
  // Manual sync function
  const sync = async () => {
    if (!isOnline) {
      toast.error('No hay conexión a internet. Intente más tarde.');
      return;
    }
    
    if (pendingCount === 0) {
      toast.info('No hay datos pendientes de sincronización.');
      return;
    }
    
    setIsSyncing(true);
    
    try {
      await syncResponses();
      setLastSyncTime(new Date());
      toast.success(`Sincronización completa: ${pendingCount} ${pendingCount === 1 ? 'encuesta' : 'encuestas'} sincronizada${pendingCount === 1 ? '' : 's'}`);
    } catch (error) {
      console.error('Error syncing data:', error);
      toast.error('Error al sincronizar datos. Intente nuevamente.');
    } finally {
      setIsSyncing(false);
    }
  };
  
  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    sync,
  };
}
