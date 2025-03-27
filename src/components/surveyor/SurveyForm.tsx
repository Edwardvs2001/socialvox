
import { useState, useEffect, useMemo } from 'react';
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
import { Check, ChevronLeft, ChevronRight, Loader2, Lock, Mic, MessageSquare, ListChecks, MapPin, User, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [currentStep, setCurrentStep] = useState<'demographics' | 'questions'>('demographics');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Demographic information
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  
  // Audio recording
  const audioRecorder = useAudioRecorder();
  
  // Filter questions based on conditional logic
  const visibleQuestions = useMemo(() => {
    return survey.questions.filter(question => {
      // If question has no dependencies, always show it
      if (!question.dependsOn) return true;
      
      // Get the parent question
      const parentQuestion = survey.questions.find(q => q.id === question.dependsOn);
      if (!parentQuestion) return true; // If parent not found, show it
      
      // Get user's answer to the parent question
      const parentAnswer = answers[parentQuestion.id];
      if (!parentAnswer) return false; // If parent not answered, don't show
      
      // Show if user's answer is in the showWhen array
      return question.showWhen?.includes(parentAnswer) || false;
    });
  }, [survey.questions, answers]);
  
  // Current question
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  
  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / visibleQuestions.length) * 100;
  
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
  
  // Check if demographics is complete
  const isDemographicsComplete = () => {
    if (!survey.collectDemographics) return true;
    return !!age && !!gender && !!location;
  };
  
  // Check if form is complete
  const isFormComplete = visibleQuestions.every(q => {
    if (q.type === 'multiple-choice') {
      return !!answers[q.id];
    } else {
      return !!textAnswers[q.id]?.trim();
    }
  }) && isDemographicsComplete();
  
  // Check if we can proceed to next question
  const canGoNext = currentQuestionIndex < visibleQuestions.length - 1 && isCurrentQuestionAnswered();
  
  // Check if we can go back
  const canGoBack = currentQuestionIndex > 0 || currentStep === 'questions';
  
  // Reset form when survey changes
  useEffect(() => {
    setAnswers({});
    setTextAnswers({});
    setCurrentStep(survey.collectDemographics ? 'demographics' : 'questions');
    setCurrentQuestionIndex(0);
    setAge('');
    setGender('');
    setLocation('');
    
    // Start recording audio automatically
    if (!audioRecorder.isRecording) {
      audioRecorder.startRecording();
    }
  }, [survey.id, survey.collectDemographics]);
  
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
    if (currentStep === 'demographics' && isDemographicsComplete()) {
      setCurrentStep('questions');
    } else if (canGoNext) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  // Navigate to previous question
  const goToPreviousQuestion = () => {
    if (currentStep === 'questions' && currentQuestionIndex === 0) {
      setCurrentStep('demographics');
    } else if (canGoBack) {
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
      const formattedAnswers = visibleQuestions.map(question => {
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
        audioRecording: audioBase64,
        respondentInfo: survey.collectDemographics ? {
          age: age ? parseInt(age) : undefined,
          gender,
          location
        } : undefined
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
          style={{ width: currentStep === 'demographics' ? '10%' : `${progress}%` }}
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
      
      {/* Demographics or Question card */}
      <Card className="surveyor-card">
        {currentStep === 'demographics' && survey.collectDemographics ? (
          <>
            <CardHeader className={isMobile ? "spacing-mobile-tight" : ""}>
              <div className="flex justify-between items-center mb-2">
                <div className={`${isMobile ? "text-mobile-xs" : "text-sm"} text-muted-foreground`}>
                  Información del Encuestado
                </div>
                {isDemographicsComplete() && (
                  <div className={`${isMobile ? "text-mobile-xs" : "text-sm"} inline-flex items-center text-green-600`}>
                    <Check className="w-4 h-4 mr-1" />
                    Completado
                  </div>
                )}
              </div>
              <CardTitle className={isMobile ? "text-mobile-base" : ""}>
                Datos Demográficos
              </CardTitle>
              <CardDescription className={isMobile ? "text-mobile-xs" : ""}>
                Por favor, proporciona la siguiente información sobre el encuestado
              </CardDescription>
            </CardHeader>
            <CardContent className={isMobile ? "spacing-mobile-tight" : ""}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-surveyor" />
                    Edad
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Ingresa la edad"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender" className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-surveyor" />
                    Género
                  </Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Selecciona el género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="femenino">Femenino</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                      <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-surveyor" />
                    Lugar de la encuesta
                  </Label>
                  <Input
                    id="location"
                    placeholder="Ingresa el lugar donde se realiza la encuesta"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className={isMobile ? "spacing-mobile-tight" : ""}>
              <div className="flex justify-between items-center mb-2">
                <div className={`${isMobile ? "text-mobile-xs" : "text-sm"} text-muted-foreground`}>
                  Pregunta {currentQuestionIndex + 1} de {visibleQuestions.length}
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
          </>
        )}
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
          
          {(currentStep === 'demographics' && isDemographicsComplete()) || canGoNext ? (
            <Button
              onClick={goToNextQuestion}
              disabled={currentStep === 'demographics' ? !isDemographicsComplete() : !isCurrentQuestionAnswered()}
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
        {survey.collectDemographics && (
          <div className="flex items-center text-xs">
            <div className={`w-4 h-4 flex items-center justify-center rounded-full mr-2 
              ${isDemographicsComplete() ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
              {isDemographicsComplete() ? <Check className="w-3 h-3" /> : '1'}
            </div>
            <span>Completar información demográfica</span>
          </div>
        )}
        <div className="flex items-center text-xs">
          <div className={`w-4 h-4 flex items-center justify-center rounded-full mr-2 
            ${isFormComplete ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
            {isFormComplete ? <Check className="w-3 h-3" /> : survey.collectDemographics ? '2' : '1'}
          </div>
          <span>Responder todas las preguntas</span>
        </div>
        <div className="flex items-center text-xs">
          <div className={`w-4 h-4 flex items-center justify-center rounded-full mr-2 
            ${audioRecorder.audioBlob ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
            {audioRecorder.audioBlob ? <Check className="w-3 h-3" /> : survey.collectDemographics ? '3' : '2'}
          </div>
          <span>Grabar audio durante la encuesta</span>
        </div>
      </div>
    </div>
  );
}
