
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Survey, SurveyQuestion, useSurveyStore } from '@/store/surveyStore';
import { useAuthStore } from '@/store/authStore';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AudioRecorder } from './AudioRecorder';
import { blobToBase64 } from '@/utils/api';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, Loader2, Lock, Mic, MessageSquare, ListChecks } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SurveyFormProps {
  survey: Survey;
}

export function SurveyForm({ survey }: SurveyFormProps) {
  const { user } = useAuthStore();
  const { submitResponse } = useSurveyStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // State for selected answers
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [textAnswers, setTextAnswers] = useState<{ [questionId: string]: string }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Audio recording
  const audioRecorder = useAudioRecorder();
  
  // Current question
  const currentQuestion = survey.questions[currentQuestionIndex];
  
  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;
  
  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (!currentQuestion) return false;
    
    if (currentQuestion.type === 'multiple-choice') {
      return !!answers[currentQuestion.id];
    } else {
      // For free-text questions, require some text
      return !!textAnswers[currentQuestion.id]?.trim();
    }
  };
  
  // Check if form is complete
  const isFormComplete = survey.questions.every(q => {
    if (q.type === 'multiple-choice') {
      return !!answers[q.id];
    } else {
      return !!textAnswers[q.id]?.trim();
    }
  });
  
  // Check if we can proceed to next question
  const canGoNext = currentQuestionIndex < survey.questions.length - 1 && isCurrentQuestionAnswered();
  
  // Check if we can go back
  const canGoBack = currentQuestionIndex > 0;
  
  // Reset form when survey changes
  useEffect(() => {
    setAnswers({});
    setTextAnswers({});
    setCurrentQuestionIndex(0);
    
    // Start recording audio automatically
    if (!audioRecorder.isRecording) {
      audioRecorder.startRecording();
    }
  }, [survey.id]);
  
  // Handle answer selection for multiple choice
  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  // Handle text answer input
  const handleTextAnswer = (questionId: string, text: string) => {
    setTextAnswers(prev => ({
      ...prev,
      [questionId]: text
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
    
    setIsSubmitting(true);
    
    try {
      // Stop recording if still active
      if (audioRecorder.isRecording) {
        audioRecorder.stopRecording();
        // Give time for the recording to finalize
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Format answers for submission
      const formattedAnswers = survey.questions.map(question => {
        if (question.type === 'multiple-choice') {
          return {
            questionId: question.id,
            selectedOption: answers[question.id] || ''
          };
        } else {
          return {
            questionId: question.id,
            selectedOption: '',
            textAnswer: textAnswers[question.id] || ''
          };
        }
      });
      
      // Convert audio blob to base64 for storage
      const audioBase64 = audioRecorder.audioBlob 
        ? await blobToBase64(audioRecorder.audioBlob) 
        : null;
      
      // Submit the response
      await submitResponse({
        surveyId: survey.id,
        respondentId: user?.id || '',
        answers: formattedAnswers,
        audioRecording: audioBase64
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
      
      {/* Audio recorder */}
      <Card className="border-surveyor/20 bg-surveyor/5">
        <CardHeader className={isMobile ? "spacing-mobile-tight" : "pb-2"}>
          <CardTitle className={`${isMobile ? "text-mobile-sm" : "text-md"} flex items-center`}>
            <Mic className="w-4 h-4 mr-2 text-surveyor" />
            Grabación de Audio
          </CardTitle>
          <CardDescription className={isMobile ? "text-mobile-xs" : ""}>
            Se está grabando audio durante toda la encuesta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AudioRecorder recorder={audioRecorder} />
        </CardContent>
      </Card>
      
      {/* Question card */}
      <Card className="surveyor-card">
        <CardHeader className={isMobile ? "spacing-mobile-tight" : ""}>
          <div className="flex justify-between items-center mb-2">
            <div className={`${isMobile ? "text-mobile-xs" : "text-sm"} text-muted-foreground`}>
              Pregunta {currentQuestionIndex + 1} de {survey.questions.length}
            </div>
            {isCurrentQuestionAnswered() && (
              <div className={`${isMobile ? "text-mobile-xs" : "text-sm"} inline-flex items-center text-green-600`}>
                <Check className="w-4 h-4 mr-1" />
                Respondido
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <CardTitle className={isMobile ? "text-mobile-base" : ""}>
              {currentQuestion?.text}
            </CardTitle>
            <span className={`${isMobile ? "text-mobile-xs" : "text-xs"} bg-muted px-2 py-1 rounded-full flex items-center`}>
              {currentQuestion?.type === 'multiple-choice' ? (
                <><ListChecks className="w-3 h-3 mr-1" /> Opción Múltiple</>
              ) : (
                <><MessageSquare className="w-3 h-3 mr-1" /> Respuesta Libre</>
              )}
            </span>
          </div>
        </CardHeader>
        <CardContent className={isMobile ? "spacing-mobile-tight" : ""}>
          {currentQuestion?.type === 'multiple-choice' ? (
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
                    className={`${isMobile ? "text-mobile-sm" : ""} flex-grow cursor-pointer py-2`}
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-2">
              <Textarea 
                placeholder="Escribe tu respuesta aquí..."
                value={textAnswers[currentQuestion?.id] || ''}
                onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          )}
        </CardContent>
        <CardFooter className={`flex justify-between border-t ${isMobile ? "pt-3" : "pt-4"}`}>
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={!canGoBack}
            size={isMobile ? "sm" : "default"}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            <span className={isMobile ? "text-mobile-xs" : ""}>Anterior</span>
          </Button>
          
          {canGoNext ? (
            <Button
              onClick={goToNextQuestion}
              disabled={!isCurrentQuestionAnswered()}
              className="btn-surveyor"
              size={isMobile ? "sm" : "default"}
            >
              <span className={isMobile ? "text-mobile-xs" : ""}>Siguiente</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isFormComplete || isSubmitting || !audioRecorder.audioBlob}
              className="btn-surveyor"
              size={isMobile ? "sm" : "default"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className={isMobile ? "text-mobile-xs" : ""}>Enviando...</span>
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  <span className={isMobile ? "text-mobile-xs" : ""}>Finalizar</span>
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {/* Form completion requirements */}
      <div className={`${isMobile ? "text-mobile-xs spacing-mobile-tight" : "text-sm"} text-muted-foreground space-y-2 bg-muted/50 p-4 rounded-lg`}>
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
      </div>
    </div>
  );
}
