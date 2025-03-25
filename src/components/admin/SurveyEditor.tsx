
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { useSurveyStore, Survey, SurveyQuestion } from '@/store/surveyStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Plus, Save, Trash, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(3, {
    message: "El título debe tener al menos 3 caracteres",
  }),
  description: z.string().min(5, {
    message: "La descripción debe tener al menos 5 caracteres",
  }),
  isActive: z.boolean().default(true),
});

interface SurveyEditorProps {
  surveyId: string | null;
}

export function SurveyEditor({ surveyId }: SurveyEditorProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getSurveyById, createSurvey, updateSurvey, isLoading } = useSurveyStore();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [showDeleteQuestionDialog, setShowDeleteQuestionDialog] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const existingSurvey = surveyId ? getSurveyById(surveyId) : null;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: existingSurvey?.title || "",
      description: existingSurvey?.description || "",
      isActive: existingSurvey?.isActive ?? true,
    },
  });
  
  // Initialize questions from existing survey
  useEffect(() => {
    if (existingSurvey) {
      setQuestions(existingSurvey.questions);
    }
  }, [existingSurvey]);
  
  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: uuidv4(),
      text: "",
      options: ["", ""]
    };
    setQuestions([...questions, newQuestion]);
  };
  
  const updateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, text } : q
    ));
  };
  
  const updateOptionText = (questionId: string, optionIndex: number, text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.map((opt, idx) => 
              idx === optionIndex ? text : opt
            ) 
          } 
        : q
    ));
  };
  
  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { ...q, options: [...q.options, ""] } 
        : q
    ));
  };
  
  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.filter((_, idx) => idx !== optionIndex) 
          } 
        : q
    ));
  };
  
  const confirmDeleteQuestion = (id: string) => {
    setQuestionToDelete(id);
    setShowDeleteQuestionDialog(true);
  };
  
  const deleteQuestion = () => {
    if (questionToDelete) {
      setQuestions(questions.filter(q => q.id !== questionToDelete));
      setShowDeleteQuestionDialog(false);
      setQuestionToDelete(null);
    }
  };
  
  const validateQuestions = (): boolean => {
    // Make sure we have at least one question
    if (questions.length === 0) {
      toast.error("Debe agregar al menos una pregunta a la encuesta");
      return false;
    }
    
    // Validate each question and its options
    for (const question of questions) {
      if (!question.text.trim()) {
        toast.error("Todas las preguntas deben tener un texto");
        return false;
      }
      
      if (question.options.length < 2) {
        toast.error(`La pregunta "${question.text}" debe tener al menos 2 opciones`);
        return false;
      }
      
      for (const option of question.options) {
        if (!option.trim()) {
          toast.error(`Todas las opciones de la pregunta "${question.text}" deben tener texto`);
          return false;
        }
      }
    }
    
    return true;
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!validateQuestions()) return;
    
    setIsSubmitting(true);
    
    try {
      if (existingSurvey) {
        // Update existing survey
        await updateSurvey(existingSurvey.id, {
          ...values,
          questions,
        });
        toast.success("Encuesta actualizada correctamente");
      } else {
        // Create new survey
        if (!user) {
          toast.error("Necesita iniciar sesión para crear una encuesta");
          return;
        }
        
        await createSurvey({
          title: values.title,
          description: values.description,
          isActive: values.isActive,
          questions,
          createdBy: user.id,
          assignedTo: [],
        });
        toast.success("Encuesta creada correctamente");
      }
      
      // Navigate back to surveys list
      navigate("/admin/surveys");
    } catch (error) {
      console.error("Error saving survey:", error);
      toast.error("Error al guardar la encuesta");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Detalles básicos de la encuesta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título de la encuesta" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nombre descriptivo para identificar la encuesta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descripción de la encuesta" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Explica brevemente el propósito de esta encuesta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Encuesta Activa</FormLabel>
                      <FormDescription>
                        Las encuestas activas son visibles para los encuestadores
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Preguntas</CardTitle>
                <CardDescription>Preguntas y opciones de respuesta</CardDescription>
              </div>
              <Button 
                type="button" 
                onClick={addQuestion}
                variant="outline"
                className="btn-admin"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Pregunta
              </Button>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-2" />
                  <p>No has agregado preguntas a esta encuesta.</p>
                  <p>Haz clic en "Agregar Pregunta" para comenzar.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {questions.map((question, qIndex) => (
                    <Card key={question.id} className="border-admin/20">
                      <CardHeader className="pb-2 flex flex-row items-start justify-between">
                        <div className="space-y-1 w-full">
                          <FormLabel htmlFor={`question-${question.id}`}>
                            Pregunta {qIndex + 1}
                          </FormLabel>
                          <Input
                            id={`question-${question.id}`}
                            value={question.text}
                            placeholder="Texto de la pregunta"
                            onChange={(e) => updateQuestionText(question.id, e.target.value)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => confirmDeleteQuestion(question.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          <FormLabel>Opciones de respuesta</FormLabel>
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <Input
                                value={option}
                                placeholder={`Opción ${oIndex + 1}`}
                                onChange={(e) => updateOptionText(question.id, oIndex, e.target.value)}
                                className="flex-1"
                              />
                              {question.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive shrink-0"
                                  onClick={() => removeOption(question.id, oIndex)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(question.id)}
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Agregar Opción
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/surveys")}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="btn-admin" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {existingSurvey ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {existingSurvey ? "Actualizar Encuesta" : "Crear Encuesta"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
      
      {/* Delete Question Dialog */}
      <AlertDialog open={showDeleteQuestionDialog} onOpenChange={setShowDeleteQuestionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta pregunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La pregunta será eliminada permanentemente
              de la encuesta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteQuestion();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
