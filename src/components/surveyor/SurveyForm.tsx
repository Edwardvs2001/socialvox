
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Survey, SurveyQuestion, useSurveyStore } from '@/store/surveyStore';
import { useAuthStore } from '@/store/authStore';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AudioRecorder } from './AudioRecorder';
import { blobToBase64 } from '@/utils/api';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, Loader2, MapPin, Mic } from 'lucide-react';

interface SurveyFormProps {
  survey: Survey;
}

export function SurveyForm({ survey }: SurveyFormProps) {
  const { user } = useAuthStore();
  const { submitResponse } = useSurveyStore();
  const navigate = useNavigate();
  
  // State for selected answers
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Audio recording
  const audioRecorder = useAudioRecorder();
  
  // Location tracking
  const { location, isLoading: isLoadingLocation, permissionStatus, getCurrentPosition } = useGeolocation();
  
  // Current question
  const currentQuestion = survey.questions[currentQuestionIndex];
  
  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  
  // Check if form is complete
  const isFormComplete = survey.questions.every(q => answers[q.id]);
  
  // Check if we can proceed to next question
  const canGoNext = currentQuestionIndex < survey.questions.length - 1 && answers[currentQuestion?.id];
  
  // Check if we can go back
  const canGoBack = currentQuestionIndex > 0;
  
  // Reset form when survey changes
  useEffect(() => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    
    // Start recording audio automatically
    if (!audioRecorder.isRecording) {
      audioRecorder.startRecording();
    }
    
    // Request location if not already granted
    if (permissionStatus !== 'granted') {
      getCurrentPosition();
    }
  }, [survey.id]);
  
  // Request location updates periodically to improve accuracy
  useEffect(() => {
    // Request initial location
    getCurrentPosition();
    
    // Set up interval to refresh location every 30 seconds while filling out the survey
    const intervalId = setInterval(() => {
      if (permissionStatus === 'granted') {
        getCurrentPosition();
      }
    }, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [permissionStatus]);
  
  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  // Navigate to next question
  const goToNextQuestion = () => {
    if (canGoNext) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  // Navigate to previous question
  const goToPreviousQuestion = () => {
    if (canGoBack) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormComplete) {
      toast.error('Por favor, responde todas las preguntas');
      return;
    }
    
    if (!audioRecorder.audioBlob) {
      toast.error('Es necesario grabar audio para completar la encuesta');
      return;
    }
    
    // Get one final location update with the highest accuracy before submitting
    if (permissionStatus === 'granted') {
      getCurrentPosition();
      // Wait a moment for the location to update
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!location.latitude || !location.longitude) {
      toast.error('No se pudo obtener la ubicación. Por favor, verifica tus permisos de ubicación y vuelve a intentarlo.');
      getCurrentPosition();
      return;
    }
    
    // Verify location accuracy is acceptable (if available)
    if (location.accuracy && location.accuracy > 100) {
      if (!confirm(`La precisión de la ubicación es de ±${location.accuracy.toFixed(0)} metros. ¿Deseas continuar de todos modos? Para mejor precisión, intenta en un área abierta.`)) {
        getCurrentPosition();
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Stop recording if still active
      if (audioRecorder.isRecording) {
        audioRecorder.stopRecording();
        // Give time for the recording to finalize
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption
      }));
      
      // Convert audio blob to base64 for storage
      const audioBase64 = audioRecorder.audioBlob 
        ? await blobToBase64(audioRecorder.audioBlob) 
        : null;
      
      // Submit the response with location data
      await submitResponse({
        surveyId: survey.id,
        respondentId: user?.id || '',
        answers: formattedAnswers,
        audioRecording: audioBase64,
        location: location
      });
      
      toast.success('Encuesta completada exitosamente');
      
      // Redirect to surveyor home
      navigate('/surveyor');
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Error al enviar la encuesta. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
        <div 
          className="bg-surveyor h-full transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Location and audio recorders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Audio recorder */}
        <Card className="border-surveyor/20 bg-surveyor/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              <Mic className="w-4 h-4 mr-2 text-surveyor" />
              Grabación de Audio
            </CardTitle>
            <CardDescription>
              Se está grabando audio durante toda la encuesta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AudioRecorder recorder={audioRecorder} />
          </CardContent>
        </Card>
        
        {/* Location card */}
        <Card className="border-surveyor/20 bg-surveyor/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-md flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-surveyor" />
              Ubicación
            </CardTitle>
            <CardDescription>
              Se registrará la ubicación al enviar la encuesta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {isLoadingLocation ? (
                <div className="flex items-center text-muted-foreground">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Obteniendo ubicación precisa...</span>
                </div>
              ) : location.latitude && location.longitude ? (
                <div className="space-y-2">
                  <div className="flex items-center text-green-600">
                    <Check className="w-4 h-4 mr-2" />
                    <span>Ubicación obtenida</span>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                    </div>
                    {location.accuracy !== null && (
                      <div className={`text-xs mt-1 flex items-center ${location.accuracy < 50 ? 'text-green-600' : location.accuracy < 100 ? 'text-amber-500' : 'text-red-500'}`}>
                        <span>Precisión: ±{location.accuracy.toFixed(1)} metros</span>
                        {location.accuracy > 100 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs ml-2"
                            onClick={getCurrentPosition}
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Mejorar precisión
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-amber-600">{location.error || 'Esperando permisos de ubicación'}</div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={getCurrentPosition}
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    Solicitar ubicación
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Question card */}
      <Card className="surveyor-card">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-muted-foreground">
              Pregunta {currentQuestionIndex + 1} de {survey.questions.length}
            </div>
            {answers[currentQuestion?.id] && (
              <div className="inline-flex items-center text-sm text-green-600">
                <Check className="w-4 h-4 mr-1" />
                Respondido
              </div>
            )}
          </div>
          <CardTitle>{currentQuestion?.text}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={answers[currentQuestion?.id]} 
            onValueChange={(value) => handleAnswerSelect(currentQuestion.id, value)}
            className="space-y-3"
          >
            {currentQuestion?.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="flex-grow cursor-pointer py-2"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={!canGoBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>
          
          {canGoNext ? (
            <Button
              onClick={goToNextQuestion}
              disabled={!answers[currentQuestion?.id]}
              className="btn-surveyor"
            >
              Siguiente
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isFormComplete || isSubmitting || !audioRecorder.audioBlob || (!location.latitude && !location.longitude)}
              className="btn-surveyor"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Finalizar
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Form completion requirements */}
      <div className="text-sm text-muted-foreground space-y-2 bg-muted/50 p-4 rounded-lg">
        <div className="font-medium">Requisitos para completar:</div>
        <div className="flex items-center text-xs">
          <div className={`w-4 h-4 flex items-center justify-center rounded-full mr-2 
            ${isFormComplete ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
            {isFormComplete ? <Check className="w-3 h-3" /> : '1'}
          </div>
          <span>Responder todas las preguntas</span>
        </div>
        <div className="flex items-center text-xs">
          <div className={`w-4 h-4 flex items-center justify-center rounded-full mr-2 
            ${audioRecorder.audioBlob ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
            {audioRecorder.audioBlob ? <Check className="w-3 h-3" /> : '2'}
          </div>
          <span>Grabar audio durante la encuesta</span>
        </div>
        <div className="flex items-center text-xs">
          <div className={`w-4 h-4 flex items-center justify-center rounded-full mr-2 
            ${location.latitude && location.longitude ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
            {location.latitude && location.longitude ? <Check className="w-3 h-3" /> : '3'}
          </div>
          <span>Permitir acceso a la ubicación</span>
        </div>
      </div>
    </div>
  );
}
