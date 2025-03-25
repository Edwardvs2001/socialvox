
import { Button } from '@/components/ui/button';
import { Pause, Play, Square, Mic } from 'lucide-react';

interface AudioRecorderProps {
  recorder: {
    isRecording: boolean;
    isPaused: boolean;
    startRecording: () => void;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    audioUrl: string | null;
    formattedTime: string;
  };
}

export function AudioRecorder({ recorder }: AudioRecorderProps) {
  const { 
    isRecording, 
    isPaused, 
    startRecording, 
    stopRecording, 
    pauseRecording, 
    resumeRecording,
    audioUrl,
    formattedTime
  } = recorder;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        {/* Recording indicator */}
        <div className="flex items-center">
          {isRecording && !isPaused ? (
            <div className="recording-indicator mr-2"></div>
          ) : (
            <div className="w-3 h-3 rounded-full bg-muted mr-2"></div>
          )}
          <span className="text-sm font-mono">
            {formattedTime}
          </span>
        </div>
        
        {/* Controls */}
        <div className="flex space-x-2">
          {!isRecording ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={startRecording}
              className="text-surveyor border-surveyor/20 hover:bg-surveyor/10"
            >
              <Mic className="h-4 w-4 mr-1" />
              Grabar
            </Button>
          ) : isPaused ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={resumeRecording}
              className="text-surveyor border-surveyor/20 hover:bg-surveyor/10"
            >
              <Play className="h-4 w-4 mr-1" />
              Continuar
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline"
              onClick={pauseRecording}
              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
            >
              <Pause className="h-4 w-4 mr-1" />
              Pausar
            </Button>
          )}
          
          {isRecording && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={stopRecording}
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
            >
              <Square className="h-4 w-4 mr-1" />
              Detener
            </Button>
          )}
        </div>
      </div>
      
      {/* Audio player */}
      {audioUrl && (
        <div className="pt-2">
          <audio controls src={audioUrl} className="w-full h-8" />
        </div>
      )}
      
      {/* Status message */}
      <p className="text-xs text-muted-foreground">
        {isRecording && !isPaused && 'Grabando audio...'}
        {isPaused && 'Grabación pausada'}
        {!isRecording && !audioUrl && 'La grabación de audio es obligatoria para completar la encuesta'}
        {!isRecording && audioUrl && 'Audio grabado correctamente'}
      </p>
    </div>
  );
}
