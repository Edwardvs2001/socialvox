
import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface SurveyorLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showSurveyorHeader?: boolean;
}

export function SurveyorLayout({ 
  children,
  title,
  description,
  showSurveyorHeader = false
}: SurveyorLayoutProps) {
  const { isOnline, isSyncing, pendingCount, sync } = useOfflineSync();
  
  return (
    <>
      {showSurveyorHeader && (
        <div className="w-full py-1 bg-blue-700 text-white text-center text-sm">
          encuestador.encuestasva.com
        </div>
      )}
      <Navbar isSurveyorView={true} />
      <main className="flex-1 container py-6 md:py-10 animate-fade-in">
        {(title || description) && (
          <div className="mb-8">
            {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
            {description && <p className="text-muted-foreground mt-2">{description}</p>}
          </div>
        )}
        
        {/* Show sync status for surveyor */}
        {pendingCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-3"></div>
              <span className="text-sm text-yellow-800">
                Tienes {pendingCount} {pendingCount === 1 ? 'encuesta' : 'encuestas'} por sincronizar
              </span>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={sync}
              disabled={!isOnline || isSyncing}
              className="text-xs"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Sincronizar
                </>
              )}
            </Button>
          </div>
        )}
        
        {!isOnline && (
          <div className="bg-muted border rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-3"></div>
              <span className="text-sm">
                Estás trabajando sin conexión. Los datos se guardarán localmente y se sincronizarán cuando recuperes la conexión.
              </span>
            </div>
          </div>
        )}
        
        {children}
      </main>
    </>
  );
}
